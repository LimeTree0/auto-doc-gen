package com.limecoding.core.memo.application;

import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.memo.domain.MemoStatus;
import com.limecoding.core.memo.infrastructure.MemoJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemoService {
    private static final int MAX_SOURCE_IDS = 10;
    private static final Path UPLOAD_DIRECTORY = Paths.get("uploads");

    private final MemoJpaRepository memoRepository;
    private final MemoGenerationQueue queue;
    private final MemoGenerationProcessor processor;
    private final DocumentApiClient documentApiClient;

    public Memo requestGeneration(List<Long> sourceIds, MultipartFile template, String prompt) {
        if (sourceIds == null || sourceIds.isEmpty()) {
            throw new IllegalArgumentException("소스 ID는 최소 1개 이상이어야 합니다");
        }
        if (sourceIds.size() > MAX_SOURCE_IDS) {
            throw new IllegalArgumentException("소스 ID는 최대 " + MAX_SOURCE_IDS + "개까지 허용됩니다");
        }

        String templateOriginalName = Optional.ofNullable(template.getOriginalFilename())
                .filter(name -> !name.isBlank())
                .orElse("template.docx");
        String templateStoredName = saveTemplate(template, templateOriginalName);

        return enqueue(sourceIds, prompt, templateStoredName, templateOriginalName);
    }

    public Memo requestGenerationFromBytes(UploadedFile template, List<Long> sourceIds, String prompt) {
        List<Long> ids = sourceIds == null ? List.of() : sourceIds;
        if (ids.size() > MAX_SOURCE_IDS) {
            throw new IllegalArgumentException("소스 ID는 최대 " + MAX_SOURCE_IDS + "개까지 허용됩니다");
        }

        String templateOriginalName = Optional.ofNullable(template.filename())
                .filter(name -> !name.isBlank())
                .orElse("template.docx");
        String templateStoredName = saveTemplateBytes(template.content(), templateOriginalName);

        return enqueue(ids, prompt, templateStoredName, templateOriginalName);
    }

    private Memo enqueue(List<Long> sourceIds, String prompt, String templateStoredName, String templateOriginalName) {
        Memo memo = memoRepository.save(new Memo(sourceIds, prompt, templateStoredName, templateOriginalName));
        log.info("Memo 생성 요청 수신: id={}, sourceIds={}, template={}, promptLen={}",
                memo.getId(), sourceIds, templateOriginalName, prompt == null ? 0 : prompt.length());
        queue.enqueue(memo.getId());
        return memo;
    }

    @Transactional(readOnly = true)
    public List<Memo> getMemos() {
        return memoRepository.findAll();
    }

    @Transactional(readOnly = true)
    public Memo getMemo(Long id) {
        return memoRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Memo not found: " + id));
    }

    public String loadResultHtml(Long id) {
        Memo memo = getMemo(id);
        if (memo.getStatus() != MemoStatus.COMPLETED) {
            throw new IllegalStateException("Memo가 아직 완료되지 않았습니다: " + memo.getStatus());
        }
        return new String(readUpload(memo.getResultStoredName()), StandardCharsets.UTF_8);
    }

    public byte[] downloadDocx(Long id) {
        Memo memo = getMemo(id);
        if (memo.getStatus() != MemoStatus.COMPLETED) {
            throw new IllegalStateException("Memo가 아직 완료되지 않았습니다: " + memo.getStatus());
        }

        if (memo.getCachedDocxStoredName() != null) {
            log.info("[Memo:{}] DOCX 캐시 hit: file={}", id, memo.getCachedDocxStoredName());
            return readUpload(memo.getCachedDocxStoredName());
        }

        log.info("[Memo:{}] DOCX 캐시 miss, fill-docx-html 호출", id);
        byte[] templateBytes = readUpload(memo.getTemplateStoredName());
        String filledHtml = new String(readUpload(memo.getResultStoredName()), StandardCharsets.UTF_8);
        byte[] docxBytes = documentApiClient.fillDocxHtml(templateBytes, filledHtml, memo.getPrompt());

        String cachedName = UUID.randomUUID() + "_cached.docx";
        try {
            Files.createDirectories(UPLOAD_DIRECTORY);
            Files.write(UPLOAD_DIRECTORY.resolve(cachedName), docxBytes);
        } catch (IOException e) {
            throw new RuntimeException("DOCX 캐시 저장 실패", e);
        }
        processor.markDocxCached(id, cachedName);
        log.info("[Memo:{}] DOCX 캐시 저장 완료: file={}, {}bytes", id, cachedName, docxBytes.length);

        return docxBytes;
    }

    private String saveTemplate(MultipartFile template, String originalName) {
        try {
            Files.createDirectories(UPLOAD_DIRECTORY);
            String storedName = UUID.randomUUID() + "_" + originalName;
            template.transferTo(UPLOAD_DIRECTORY.resolve(Objects.requireNonNull(storedName)));
            return storedName;
        } catch (IOException e) {
            throw new RuntimeException("템플릿 저장 실패", e);
        }
    }

    private String saveTemplateBytes(byte[] content, String originalName) {
        try {
            Files.createDirectories(UPLOAD_DIRECTORY);
            String storedName = UUID.randomUUID() + "_" + originalName;
            Files.write(UPLOAD_DIRECTORY.resolve(storedName), content);
            return storedName;
        } catch (IOException e) {
            throw new RuntimeException("템플릿 저장 실패", e);
        }
    }

    private byte[] readUpload(String storedName) {
        try {
            return Files.readAllBytes(UPLOAD_DIRECTORY.resolve(storedName));
        } catch (IOException e) {
            throw new RuntimeException("파일 읽기 실패: " + storedName, e);
        }
    }
}
