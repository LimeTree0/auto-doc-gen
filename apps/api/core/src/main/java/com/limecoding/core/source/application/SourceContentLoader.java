package com.limecoding.core.source.application;

import com.limecoding.core.source.domain.Source;
import com.limecoding.core.source.infrastructure.SourceJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Component
@RequiredArgsConstructor
public class SourceContentLoader {

    private static final Path UPLOAD_DIRECTORY = Paths.get("uploads");

    private final SourceJpaRepository sourceJpaRepository;

    public LoadedSource load(Long sourceId) {
        Source source = sourceJpaRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + sourceId));
        try {
            byte[] content = Files.readAllBytes(UPLOAD_DIRECTORY.resolve(source.getStoredName()));
            return new LoadedSource(source.getOriginalName(), content);
        } catch (Exception e) {
            throw new RuntimeException("소스 파일 읽기 실패: " + sourceId, e);
        }
    }
}
