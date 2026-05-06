package com.limecoding.core.memo.infrastructure;

import com.limecoding.core.memo.application.DocumentGenerationClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
public class MockDocumentGenerationClient implements DocumentGenerationClient {

    private static final long MOCK_DELAY_MS = 3_000L;

    @Override
    public byte[] generate(List<byte[]> sourceFiles, byte[] template, String prompt) {
        log.info("Mock generation: sources={}, templateBytes={}, promptLen={}",
                sourceFiles.size(), template.length, prompt == null ? 0 : prompt.length());
        try {
            Thread.sleep(MOCK_DELAY_MS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Mock generation 인터럽트", e);
        }
        return template;
    }
}
