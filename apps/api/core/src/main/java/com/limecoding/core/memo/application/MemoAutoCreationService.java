package com.limecoding.core.memo.application;

import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.source.application.SourceService;
import com.limecoding.core.source.domain.Source;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class MemoAutoCreationService {

    private final FileClassifier fileClassifier;
    private final SourceService sourceService;
    private final MemoService memoService;

    public Memo create(List<MultipartFile> files, String prompt) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("파일이 최소 1개 이상이어야 합니다");
        }

        List<UploadedFile> uploaded = new ArrayList<>(files.size());
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            String filename = Optional.ofNullable(file.getOriginalFilename())
                    .filter(name -> !name.isBlank())
                    .orElse("file_" + i);
            try {
                uploaded.add(new UploadedFile(filename, file.getBytes()));
            } catch (IOException e) {
                throw new RuntimeException("파일 읽기 실패: " + filename, e);
            }
        }

        FileClassifier.ClassificationResult classification = fileClassifier.classify(uploaded);
        UploadedFile templateFile = uploaded.get(classification.templateIndex());
        List<UploadedFile> sourceFiles = classification.sourceIndices().stream()
                .map(uploaded::get)
                .toList();

        log.info("[Auto] 분류 완료, template='{}', sources={}",
                templateFile.filename(),
                sourceFiles.stream().map(UploadedFile::filename).toList());

        List<Long> sourceIds = sourceFiles.isEmpty()
                ? List.of()
                : sourceService.uploadFromBytes(sourceFiles).stream()
                        .map(Source::getId)
                        .toList();

        return memoService.requestGenerationFromBytes(templateFile, sourceIds, prompt);
    }
}
