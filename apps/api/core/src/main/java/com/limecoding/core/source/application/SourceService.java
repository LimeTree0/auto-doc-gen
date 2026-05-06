package com.limecoding.core.source.application;

import com.limecoding.core.source.domain.Source;
import com.limecoding.core.source.infrastructure.SourceJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

@Slf4j
@RequiredArgsConstructor
@Service
public class SourceService {
    private final SourceJpaRepository sourceJpaRepository;

    public void uploadSources(List<MultipartFile> sources) {
        for (MultipartFile source : sources) {
            String storedName = saveFile(source);
            sourceJpaRepository.save(new Source(storedName, source.getOriginalFilename()));
        }
    }

    public List<Source> getSources() {
        List<Source> all = sourceJpaRepository.findAll();

        log.info("all: {}", all);

        return all;
    }

    public LoadedSource loadSource(Long sourceId) {
        Source source = sourceJpaRepository.findById(sourceId)
                .orElseThrow(() -> new IllegalArgumentException("Source not found: " + sourceId));
        try {
            byte[] content = Files.readAllBytes(Paths.get("uploads").resolve(source.getStoredName()));
            return new LoadedSource(source.getOriginalName(), content);
        } catch (Exception e) {
            throw new RuntimeException("소스 파일 읽기 실패: " + sourceId, e);
        }
    }

    private String saveFile(MultipartFile source) {
        try {
            Path uploadDirectory = Paths.get("uploads");
            Files.createDirectories(uploadDirectory);

            String storedName = getSafeFilename(source.getOriginalFilename());

            Path filePath = uploadDirectory.resolve(Objects.requireNonNull(storedName));
            source.transferTo(filePath);

            return storedName;
        } catch (Exception e) {
            throw new RuntimeException("파일 저장 실패", e);
        }
    }

    private String getSafeFilename(String originalFilename) {
        return UUID.randomUUID() + "_" + originalFilename;
    }
}
