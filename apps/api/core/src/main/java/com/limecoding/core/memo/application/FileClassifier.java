package com.limecoding.core.memo.application;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Slf4j
@Component
@RequiredArgsConstructor
public class FileClassifier {

    private static final int SNIPPET_MAX = 1024;

    private static final String CLASSIFY_PROMPT = """
            업로드된 파일 목록에서 양식(템플릿)과 자료(소스)를 구분하세요.
            - 양식은 빈칸·플레이스홀더가 많은 문서이고, 자료는 실제 내용이 채워진 문서입니다.
            - 양식은 정확히 1개 선택하고, 나머지는 모두 자료로 분류합니다.
            - 입력 텍스트는 각 파일의 index, filename, format, snippet 을 가진 JSON 배열입니다.
            - 응답은 오직 다음 JSON만 반환하세요: {"templateIndex": <int>, "sourceIndices": [<int>, ...]}
            - 코드 펜스, 설명, 다른 키 없이 위 JSON 만 반환합니다.
            """;

    private final GeminiClient geminiClient;
    private final DocumentApiClient documentApiClient;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public ClassificationResult classify(List<UploadedFile> files) {
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("파일이 비어 있습니다");
        }
        if (files.size() == 1) {
            log.info("[Classify] 단일 파일 → 템플릿으로 간주, 빈 소스로 진행");
            return new ClassificationResult(0, List.of());
        }

        List<FileDescriptor> descriptors = new ArrayList<>(files.size());
        for (int i = 0; i < files.size(); i++) {
            descriptors.add(describe(i, files.get(i)));
        }

        String json;
        try {
            json = objectMapper.writeValueAsString(descriptors);
        } catch (JsonProcessingException e) {
            throw new RuntimeException("파일 분류 직렬화 실패", e);
        }

        log.info("[Classify] Gemini 분류 호출, 파일 개수={}", files.size());
        String response = geminiClient.generate(List.of(GeminiInput.text(json)), CLASSIFY_PROMPT);
        ClassificationResult result = parse(response, files.size());
        log.info("[Classify] 결과 templateIndex={}, sourceIndices={}",
                result.templateIndex(), result.sourceIndices());
        return result;
    }

    private FileDescriptor describe(int index, UploadedFile file) {
        String filename = Optional.ofNullable(file.filename())
                .filter(name -> !name.isBlank())
                .orElse("file_" + index);
        SourceFormat format = SourceFormat.fromFilename(filename);
        String snippet = extractSnippet(file.content(), format, filename);
        return new FileDescriptor(index, filename, format.name(), snippet);
    }

    private String extractSnippet(byte[] bytes, SourceFormat format, String filename) {
        try {
            return switch (format) {
                case TEXT, HTML -> truncate(new String(bytes, StandardCharsets.UTF_8));
                case DOCX -> truncate(documentApiClient.docxToHtml(bytes, filename));
                case HWPX -> truncate(documentApiClient.hwpxToHtml(bytes, filename));
                case PDF -> null;
            };
        } catch (RuntimeException e) {
            log.warn("[Classify] 스니펫 추출 실패, 파일명만 사용: {}", filename, e);
            return null;
        }
    }

    private String truncate(String value) {
        if (value == null) {
            return null;
        }
        return value.length() > SNIPPET_MAX ? value.substring(0, SNIPPET_MAX) : value;
    }

    private ClassificationResult parse(String response, int total) {
        String cleaned = response == null ? "" : response.trim();
        if (cleaned.startsWith("```")) {
            int firstNewline = cleaned.indexOf('\n');
            int lastFence = cleaned.lastIndexOf("```");
            if (firstNewline > 0 && lastFence > firstNewline) {
                cleaned = cleaned.substring(firstNewline + 1, lastFence).trim();
            }
        }
        try {
            ClassificationDto dto = objectMapper.readValue(cleaned, ClassificationDto.class);
            int templateIndex = dto.templateIndex();
            List<Integer> sourceIndices = dto.sourceIndices() == null ? List.of() : dto.sourceIndices();
            if (templateIndex < 0 || templateIndex >= total) {
                throw new IllegalStateException("templateIndex out of range: " + templateIndex);
            }
            for (Integer idx : sourceIndices) {
                if (idx == null || idx < 0 || idx >= total || idx == templateIndex) {
                    throw new IllegalStateException("invalid sourceIndex: " + idx);
                }
            }
            return new ClassificationResult(templateIndex, List.copyOf(sourceIndices));
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("분류 응답 JSON 파싱 실패: " + cleaned, e);
        }
    }

    private record FileDescriptor(int index, String filename, String format, String snippet) {
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    private record ClassificationDto(int templateIndex, List<Integer> sourceIndices) {
    }

    public record ClassificationResult(int templateIndex, List<Integer> sourceIndices) {
    }
}
