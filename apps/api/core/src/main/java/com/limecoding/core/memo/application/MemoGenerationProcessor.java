package com.limecoding.core.memo.application;

import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.memo.infrastructure.MemoJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class MemoGenerationProcessor {
    private final MemoJpaRepository memoRepository;

    @Transactional
    public void markInProgress(Long memoId) {
        Memo memo = load(memoId);
        memo.markInProgress();
    }

    @Transactional(readOnly = true)
    public MemoSnapshot loadSnapshot(Long memoId) {
        Memo memo = load(memoId);
        return new MemoSnapshot(
                memo.getPrompt(),
                memo.getSourceIds(),
                memo.getTemplateStoredName(),
                memo.getTemplateOriginalName()
        );
    }

    @Transactional
    public void markCompleted(Long memoId, String resultStoredName) {
        Memo memo = load(memoId);
        memo.markCompleted(resultStoredName);
    }

    @Transactional
    public void markDocxCached(Long memoId, String cachedDocxStoredName) {
        Memo memo = load(memoId);
        memo.markDocxCached(cachedDocxStoredName);
    }

    @Transactional
    public void markFailed(Long memoId) {
        Memo memo = load(memoId);
        memo.markFailed();
    }

    private Memo load(Long memoId) {
        return memoRepository.findById(memoId)
                .orElseThrow(() -> new IllegalStateException("Memo not found: " + memoId));
    }
}
