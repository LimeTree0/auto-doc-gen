package com.limecoding.core.memo.application;

import com.limecoding.core.source.application.SourceService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemoGenerationQueue {
    private static final Path UPLOAD_DIRECTORY = Paths.get("uploads");

    private final MemoGenerationProcessor processor;
    private final SourceService sourceService;
    private final DocumentGenerationClient documentGenerationClient;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public void enqueue(Long memoId, byte[] templateBytes) {
        executor.submit(() -> run(memoId, templateBytes));
    }

    private void run(Long memoId, byte[] templateBytes) {
        try {
            processor.markInProgress(memoId);

            MemoSnapshot snapshot = processor.loadSnapshot(memoId);
            List<byte[]> sourceBytes = snapshot.sourceIds().stream()
                    .map(sourceService::readSourceContent)
                    .toList();

            byte[] resultBytes = documentGenerationClient.generate(sourceBytes, templateBytes, snapshot.prompt());

            String storedName = UUID.randomUUID() + "_result.docx";
            Files.createDirectories(UPLOAD_DIRECTORY);
            Files.write(UPLOAD_DIRECTORY.resolve(storedName), resultBytes);

            processor.markCompleted(memoId, storedName);
        } catch (Exception e) {
            log.error("Memo 생성 실패: memoId={}", memoId, e);
            try {
                processor.markFailed(memoId);
            } catch (Exception ex) {
                log.error("Memo FAILED 마킹 실패: memoId={}", memoId, ex);
            }
        }
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            executor.shutdownNow();
        }
    }
}
