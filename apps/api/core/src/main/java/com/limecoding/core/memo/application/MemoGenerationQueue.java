package com.limecoding.core.memo.application;

import com.limecoding.core.source.application.LoadedSource;
import com.limecoding.core.source.application.SourceService;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
public class MemoGenerationQueue {
    private static final Path UPLOAD_DIRECTORY = Paths.get("uploads");

    private static final String SUMMARY_PROMPT = """
            아래 자료들을 한국어 마크다운으로 종합 요약해 주세요.
            - 핵심 사실, 결정 사항, 액션 아이템을 절을 나누어 정리하세요.
            - 자료에 명시된 내용만 사용하고 추측은 하지 마세요.
            - 결과는 마크다운 형식으로만 반환하세요.
            """;

    private final MemoGenerationProcessor processor;
    private final SourceService sourceService;
    private final GeminiClient geminiClient;
    private final DocumentApiClient documentApiClient;
    private final TopicExtractor topicExtractor;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public void enqueue(Long memoId) {
        executor.submit(() -> run(memoId));
    }

    private void run(Long memoId) {
        try {
            processor.markInProgress(memoId);
            MemoSnapshot snapshot = processor.loadSnapshot(memoId);

            String summary = summarizeSources(snapshot.sourceIds());
            String htmlTemplate = convertTemplateToHtml(snapshot);
            String filledHtml = fillTemplate(htmlTemplate, summary, snapshot);
            String storedName = persistResult(filledHtml);

            processor.markCompleted(memoId, storedName);
        } catch (Exception e) {
            log.error("Memo 생성 실패: memoId={}", memoId, e);
            try {
                processor.markFailed(memoId);
            } catch (Exception ex) {
                log.error("Memo FAILED 마킹 실패: memoId={}", memoId, ex);
            }
        }
    }

    private String summarizeSources(List<Long> sourceIds) {
        List<GeminiInput> inputs = sourceIds.stream()
                .map(this::loadAsGeminiInput)
                .toList();
        return geminiClient.generate(inputs, SUMMARY_PROMPT);
    }

    private GeminiInput loadAsGeminiInput(Long sourceId) {
        LoadedSource loaded = sourceService.loadSource(sourceId);
        SourceFormat format = SourceFormat.fromFilename(loaded.originalName());
        return switch (format) {
            case PDF -> GeminiInput.inlineData("application/pdf", loaded.content());
            case DOCX -> GeminiInput.text(documentApiClient.docxToHtml(loaded.content(), loaded.originalName()));
            case HWPX -> GeminiInput.text(documentApiClient.hwpxToHtml(loaded.content(), loaded.originalName()));
            case TEXT -> GeminiInput.text(new String(loaded.content(), StandardCharsets.UTF_8));
        };
    }

    private String convertTemplateToHtml(MemoSnapshot snapshot) {
        byte[] templateBytes = readUpload(snapshot.templateStoredName());
        return documentApiClient.docxToHtml(templateBytes, snapshot.templateOriginalName());
    }

    private String fillTemplate(String htmlTemplate, String summaryMarkdown, MemoSnapshot snapshot) {
        String topic = topicExtractor.fromTemplateFilename(snapshot.templateOriginalName());
        return documentApiClient.fillHtmlTopic(htmlTemplate, summaryMarkdown, topic, snapshot.prompt());
    }

    private String persistResult(String filledHtml) {
        try {
            String storedName = UUID.randomUUID() + "_result.html";
            Files.createDirectories(UPLOAD_DIRECTORY);
            Files.write(UPLOAD_DIRECTORY.resolve(storedName), filledHtml.getBytes(StandardCharsets.UTF_8));
            return storedName;
        } catch (Exception e) {
            throw new RuntimeException("결과 HTML 저장 실패", e);
        }
    }

    private byte[] readUpload(String storedName) {
        try {
            return Files.readAllBytes(UPLOAD_DIRECTORY.resolve(storedName));
        } catch (Exception e) {
            throw new RuntimeException("업로드 파일 읽기 실패: " + storedName, e);
        }
    }

    @PreDestroy
    public void shutdown() {
        executor.shutdown();
        try {
            if (!executor.awaitTermination(5, TimeUnit.SECONDS)) {
                executor.shutdownNow();
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            executor.shutdownNow();
        }
    }
}
