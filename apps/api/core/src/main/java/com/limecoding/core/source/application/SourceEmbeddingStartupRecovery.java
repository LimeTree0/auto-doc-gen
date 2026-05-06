package com.limecoding.core.source.application;

import com.limecoding.core.source.domain.Source;
import com.limecoding.core.source.domain.SourceEmbeddingStatus;
import com.limecoding.core.source.infrastructure.SourceJpaRepository;
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
public class SourceEmbeddingStartupRecovery implements ApplicationRunner {

    private final SourceJpaRepository sourceRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        List<Source> stuck = sourceRepository.findAllByEmbeddingStatus(SourceEmbeddingStatus.IN_PROGRESS);
        if (stuck.isEmpty()) {
            return;
        }
        log.warn("서버 재시작으로 IN_PROGRESS 상태였던 Source {}건을 FAILED로 전환합니다", stuck.size());
        stuck.forEach(Source::markEmbeddingFailed);
    }
}
