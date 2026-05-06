package com.limecoding.core.source.application;

import com.limecoding.core.source.domain.Source;
import com.limecoding.core.source.infrastructure.SourceJpaRepository;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class SourceEmbeddingQueue {

    private static final Path UPLOAD_DIRECTORY = Paths.get("uploads");

    private final SourceEmbeddingProcessor processor;
    private final SourceIngestionService ingestionService;
    private final SourceJpaRepository sourceRepository;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public void enqueue(Long sourceId) {
        log.info("[Source:{}] 임베딩 큐에 적재", sourceId);
        executor.submit(() -> run(sourceId));
    }

    private void run(Long sourceId) {
        long startedAt = System.currentTimeMillis();
        try {
            processor.markInProgress(sourceId);
            Source source = sourceRepository.findById(sourceId)
                    .orElseThrow(() -> new IllegalStateException("Source not found: " + sourceId));
            byte[] content = Files.readAllBytes(UPLOAD_DIRECTORY.resolve(source.getStoredName()));
            int chunks = ingestionService.ingest(sourceId, source.getOriginalName(), content);
            processor.markCompleted(sourceId, chunks);
            log.info("[Source:{}] 임베딩 완료, 청크={}, 총 {}ms",
                    sourceId, chunks, System.currentTimeMillis() - startedAt);
        } catch (Throwable t) {
            log.error("[Source:{}] 임베딩 실패, 총 {}ms",
                    sourceId, System.currentTimeMillis() - startedAt, t);
            try {
                processor.markFailed(sourceId);
            } catch (Throwable ex) {
                log.error("[Source:{}] FAILED 마킹 실패", sourceId, ex);
            }
            if (t instanceof Error) {
                throw (Error) t;
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
