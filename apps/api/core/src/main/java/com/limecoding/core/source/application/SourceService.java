package com.limecoding.core.source.application;

import com.limecoding.core.memo.application.MemoService;
import com.limecoding.core.memo.application.TopicExtractor;
import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.memo.domain.MemoStatus;
import com.limecoding.core.source.domain.Source;
import com.limecoding.core.source.infrastructure.SourceJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.ai.vectorstore.filter.FilterExpressionBuilder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class SourceService {
    private final SourceJpaRepository sourceJpaRepository;
    private final SourceEmbeddingQueue embeddingQueue;
    private final SourceContentLoader sourceContentLoader;
    private final VectorStore vectorStore;
    private final MemoService memoService;
    private final TopicExtractor topicExtractor;

    public void uploadSources(List<MultipartFile> sources) {
        for (MultipartFile source : sources) {
            String storedName = saveFile(source);
            Source saved = sourceJpaRepository.save(new Source(storedName, source.getOriginalFilename()));
            embeddingQueue.enqueue(saved.getId());
        }
    }

    public Source uploadFromMemo(Long memoId) {
        if (memoId == null) {
            throw new IllegalArgumentException("memoId 가 비어 있습니다");
        }
        Memo memo = memoService.getMemo(memoId);
        if (memo.getStatus() != MemoStatus.COMPLETED) {
            throw new IllegalStateException(
                    "완료된 메모만 소스로 등록할 수 있습니다: status=" + memo.getStatus());
        }

        String html = memoService.loadResultHtml(memoId);
        byte[] bytes = html.getBytes(StandardCharsets.UTF_8);
        String topic = topicExtractor.fromTemplateFilename(memo.getTemplateOriginalName());
        String originalName = topic + ".html";
        String storedName = saveBytes(bytes, originalName);

        Source saved = sourceJpaRepository.save(new Source(storedName, originalName));
        embeddingQueue.enqueue(saved.getId());
        log.info("Memo:{} → Source:{} 등록 완료, 임베딩 큐잉 (originalName={}, {}bytes)",
                memoId, saved.getId(), originalName, bytes.length);
        return saved;
    }

    public List<Source> getSources() {
        List<Source> all = sourceJpaRepository.findAll();

        log.info("all: {}", all);

        return all;
    }

    public LoadedSource loadSource(Long sourceId) {
        return sourceContentLoader.load(sourceId);
    }

    @Transactional
    public void deleteSource(Long sourceId) {
        if (sourceId == null) {
            throw new IllegalArgumentException("sourceId 가 비어 있습니다");
        }
        Source source = sourceJpaRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + sourceId));

        deleteEmbeddings(sourceId);
        deleteUploadFile(source.getStoredName());
        sourceJpaRepository.delete(source);
        log.info("Source:{} 삭제 완료 (file={}, originalName={})",
                sourceId, source.getStoredName(), source.getOriginalName());
    }

    private void deleteEmbeddings(Long sourceId) {
        try {
            FilterExpressionBuilder builder = new FilterExpressionBuilder();
            vectorStore.delete(builder.eq(SourceIngestionService.META_SOURCE_ID, sourceId).build());
            log.info("[Source:{}] vectorStore 항목 삭제", sourceId);
        } catch (Exception e) {
            log.warn("[Source:{}] vectorStore 항목 삭제 실패 (계속 진행)", sourceId, e);
        }
    }

    private void deleteUploadFile(String storedName) {
        if (storedName == null || storedName.isBlank()) {
            return;
        }
        try {
            boolean removed = Files.deleteIfExists(Paths.get("uploads").resolve(storedName));
            if (removed) {
                log.info("업로드 파일 삭제: {}", storedName);
            }
        } catch (Exception e) {
            log.warn("업로드 파일 삭제 실패 (계속 진행): {}", storedName, e);
        }
    }

    private String saveFile(MultipartFile source) {
        try {
            Path uploadDirectory = Paths.get("uploads");
            Files.createDirectories(uploadDirectory);

            String storedName = getSafeFilename(source.getOriginalFilename());

            Path filePath = uploadDirectory.resolve(Objects.requireNonNull(storedName));
            source.transferTo(filePath);

            return storedName;
        } catch (Exception e) {
            throw new RuntimeException("파일 저장 실패", e);
        }
    }

    private String saveBytes(byte[] content, String originalName) {
        try {
            Path uploadDirectory = Paths.get("uploads");
            Files.createDirectories(uploadDirectory);
            String storedName = getSafeFilename(originalName);
            Files.write(uploadDirectory.resolve(storedName), content);
            return storedName;
        } catch (Exception e) {
            throw new RuntimeException("파일 저장 실패", e);
        }
    }

    private String getSafeFilename(String originalFilename) {
        return UUID.randomUUID() + "_" + originalFilename;
    }
}
