package com.limecoding.core.memo.application;

import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.memo.domain.MemoStatus;
import com.limecoding.core.memo.infrastructure.MemoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MemoService {
    private static final int MAX_SOURCE_IDS = 10;
    private static final Path UPLOAD_DIRECTORY = Paths.get("uploads");

    private final MemoJpaRepository memoRepository;
    private final MemoGenerationQueue queue;

    @Transactional
    public Memo requestGeneration(List<Long> sourceIds, MultipartFile template, String prompt) {
        if (sourceIds == null || sourceIds.isEmpty()) {
            throw new IllegalArgumentException("소스 ID는 최소 1개 이상이어야 합니다");
        }
        if (sourceIds.size() > MAX_SOURCE_IDS) {
            throw new IllegalArgumentException("소스 ID는 최대 " + MAX_SOURCE_IDS + "개까지 허용됩니다");
        }

        byte[] templateBytes;
        try {
            templateBytes = template.getBytes();
        } catch (IOException e) {
            throw new RuntimeException("템플릿 읽기 실패", e);
        }

        Memo memo = memoRepository.save(new Memo(sourceIds, prompt));
        queue.enqueue(memo.getId(), templateBytes);
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

    @Transactional(readOnly = true)
    public byte[] readResult(Long id) {
        Memo memo = getMemo(id);
        if (memo.getStatus() != MemoStatus.COMPLETED) {
            throw new IllegalStateException("Memo가 아직 완료되지 않았습니다: " + memo.getStatus());
        }
        try {
            return Files.readAllBytes(UPLOAD_DIRECTORY.resolve(memo.getResultStoredName()));
        } catch (IOException e) {
            throw new RuntimeException("결과 파일 읽기 실패", e);
        }
    }
}
