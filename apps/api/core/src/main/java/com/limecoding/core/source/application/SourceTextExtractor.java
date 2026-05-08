package com.limecoding.core.source.application;

import com.limecoding.core.memo.application.DocumentApiClient;
import com.limecoding.core.memo.application.SourceFormat;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.reader.tika.TikaDocumentReader;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Component
@RequiredArgsConstructor
public class SourceTextExtractor {

    private final DocumentApiClient documentApiClient;

    public String extract(byte[] content, String originalName) {
        SourceFormat format = SourceFormat.fromFilename(originalName);
        log.info("텍스트 추출 시작: name={}, format={}, bytes={}", originalName, format, content.length);
        return switch (format) {
            case PDF -> tika(content);
            case TEXT -> new String(content, StandardCharsets.UTF_8);
            case HTML -> tika(content);
            case DOCX -> tika(documentApiClient.docxToHtml(content, originalName)
                    .getBytes(StandardCharsets.UTF_8));
            case HWPX -> tika(documentApiClient.hwpxToHtml(content, originalName)
                    .getBytes(StandardCharsets.UTF_8));
            // 음성은 전사 없이는 텍스트가 없다. 빈 문자열 반환 → SourceIngestionService 가
            // 임베딩을 건너뛰고 청크 0개로 COMPLETED 처리한다.
            case AUDIO_M4A, AUDIO_MP3 -> "";
        };
    }

    private String tika(byte[] bytes) {
        TikaDocumentReader reader = new TikaDocumentReader(new ByteArrayResource(bytes));
        List<Document> documents = reader.get();
        return documents.stream()
                .map(Document::getText)
                .filter(text -> text != null && !text.isBlank())
                .collect(Collectors.joining("\n\n"));
    }
}
