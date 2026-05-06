package com.limecoding.core.source.application;

import com.limecoding.core.source.domain.Source;
import com.limecoding.core.source.infrastructure.SourceJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class SourceEmbeddingProcessor {

    private final SourceJpaRepository sourceRepository;

    @Transactional
    public void markInProgress(Long sourceId) {
        load(sourceId).markEmbeddingInProgress();
    }

    @Transactional
    public void markCompleted(Long sourceId, int chunkCount) {
        load(sourceId).markEmbeddingCompleted(chunkCount);
    }

    @Transactional
    public void markFailed(Long sourceId) {
        load(sourceId).markEmbeddingFailed();
    }

    private Source load(Long sourceId) {
        return sourceRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalStateException("Source not found: " + sourceId));
    }
}
