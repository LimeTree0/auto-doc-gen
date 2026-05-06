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
        Memo memo = memoRepository.findById(memoId)
                .orElseThrow(() -> new IllegalStateException("Memo not found: " + memoId));
        memo.markInProgress();
    }

    @Transactional(readOnly = true)
    public MemoSnapshot loadSnapshot(Long memoId) {
        Memo memo = memoRepository.findById(memoId)
                .orElseThrow(() -> new IllegalStateException("Memo not found: " + memoId));
        return new MemoSnapshot(memo.getPrompt(), memo.getSourceIds());
    }

    @Transactional
    public void markCompleted(Long memoId, String resultStoredName) {
        Memo memo = memoRepository.findById(memoId)
                .orElseThrow(() -> new IllegalStateException("Memo not found: " + memoId));
        memo.markCompleted(resultStoredName);
    }

    @Transactional
    public void markFailed(Long memoId) {
        Memo memo = memoRepository.findById(memoId)
                .orElseThrow(() -> new IllegalStateException("Memo not found: " + memoId));
        memo.markFailed();
    }
}
