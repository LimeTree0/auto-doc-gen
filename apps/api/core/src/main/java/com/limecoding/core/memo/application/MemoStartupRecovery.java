package com.limecoding.core.memo.application;

import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.memo.domain.MemoStatus;
import com.limecoding.core.memo.infrastructure.MemoJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemoStartupRecovery implements ApplicationRunner {
    private final MemoJpaRepository memoRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Memo> stuck = memoRepository.findAllByStatus(MemoStatus.IN_PROGRESS);
        if (stuck.isEmpty()) {
            return;
        }
        log.warn("서버 재시작으로 IN_PROGRESS 상태였던 메모 {}건을 FAILED로 전환합니다", stuck.size());
        stuck.forEach(Memo::markFailed);
    }
}
