package com.limecoding.core.memo.application;

import com.limecoding.core.source.application.LoadedSource;
import com.limecoding.core.source.application.SourceContentLoader;
import jakarta.annotation.PreDestroy;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
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
            첫 번째 입력은 결과물이 채워질 HTML 템플릿이고, 이후 입력들은 요약 대상 자료입니다.
            - 템플릿은 섹션·필드 구조를 파악하기 위한 참고용이며, 출력 형식이 아닙니다.
            - 템플릿의 섹션 제목과 빈칸 구조를 파악해 그에 맞춰 자료 내용을 배치하세요.
            - 템플릿에 없는 섹션은 만들지 말고, 템플릿이 요구하지만 자료에 근거가 없는 항목은 비워두세요.
            - 자료에 명시된 내용만 사용하고 추측은 하지 마세요.
            - 출력은 반드시 한국어 **마크다운**으로만 작성하세요. HTML 태그(`<h1>`, `<p>`, `<table>`, `<div>` 등), 코드 펜스(```), 그 외 마크업은 사용하지 마세요.
            - 섹션 제목은 `#`/`##`, 목록은 `-`, 라벨-값은 `**라벨**: 값` 형식을 사용하세요.
            """;

    private final MemoGenerationProcessor processor;
    private final SourceContentLoader sourceContentLoader;
    private final GeminiClient geminiClient;
    private final DocumentApiClient documentApiClient;
    private final TopicExtractor topicExtractor;
    private final MemoProgressBus progressBus;

    private final ExecutorService executor = Executors.newSingleThreadExecutor();

    public void enqueue(Long memoId) {
        log.info("[Memo:{}] 큐에 적재", memoId);
        executor.submit(() -> run(memoId));
    }

    private void run(Long memoId) {
        long startedAt = System.currentTimeMillis();
        log.info("[Memo:{}] 워커 시작", memoId);
        try {
            processor.markInProgress(memoId);
            MemoSnapshot snapshot = processor.loadSnapshot(memoId);
            log.info("[Memo:{}] IN_PROGRESS 전환 완료, sourceIds={}, template={}",
                    memoId, snapshot.sourceIds(), snapshot.templateOriginalName());

            long stepAt = System.currentTimeMillis();
            progressBus.publish(memoId, "템플릿 분석 중...");
            log.info("[Memo:{}] (1/4) 템플릿 HTML 변환 시작: storedName={}, originalName={}",
                    memoId, snapshot.templateStoredName(), snapshot.templateOriginalName());
            String htmlTemplate = convertTemplateToHtml(snapshot);
            log.info("[Memo:{}] (1/4) 템플릿 HTML 변환 완료, 길이={}자, {}ms",
                    memoId, htmlTemplate.length(), System.currentTimeMillis() - stepAt);

            stepAt = System.currentTimeMillis();
            progressBus.publish(memoId, "자료 요약 중...");
            String summary = summarizeSources(snapshot.sourceIds(), htmlTemplate);
            log.info("[Memo:{}] (2/4) 소스 요약 완료, 길이={}자, {}ms",
                    memoId, summary.length(), System.currentTimeMillis() - stepAt);

            stepAt = System.currentTimeMillis();
            progressBus.publish(memoId, "보고서 작성 중...");
            String filledHtml = fillTemplate(htmlTemplate, summary, snapshot);
            log.info("[Memo:{}] (3/4) 템플릿 채우기 완료, 길이={}자, {}ms",
                    memoId, filledHtml.length(), System.currentTimeMillis() - stepAt);

            stepAt = System.currentTimeMillis();
            progressBus.publish(memoId, "결과 저장 중...");
            String storedName = persistResult(filledHtml);
            log.info("[Memo:{}] (4/4) 결과 HTML 저장 완료, file={}, {}ms",
                    memoId, storedName, System.currentTimeMillis() - stepAt);

            processor.markCompleted(memoId, storedName);
            log.info("[Memo:{}] COMPLETED, 총 {}ms", memoId, System.currentTimeMillis() - startedAt);
        } catch (Throwable t) {
            log.error("[Memo:{}] 생성 실패, 총 {}ms", memoId, System.currentTimeMillis() - startedAt, t);
            try {
                processor.markFailed(memoId);
            } catch (Throwable ex) {
                log.error("[Memo:{}] FAILED 마킹 실패", memoId, ex);
            }
            if (t instanceof Error) {
                throw (Error) t;
            }
        }
    }

    private String summarizeSources(List<Long> sourceIds, String htmlTemplate) {
        if (sourceIds == null || sourceIds.isEmpty()) {
            log.info("자료 없음, 요약 생략");
            return "";
        }
        List<GeminiInput> inputs = new ArrayList<>();
        inputs.add(GeminiInput.text(htmlTemplate));
        sourceIds.stream()
                .map(this::loadAsGeminiInput)
                .forEach(inputs::add);
        log.info("Gemini 호출 준비: input 개수={} (템플릿 포함)", inputs.size());
        return geminiClient.generate(inputs, SUMMARY_PROMPT);
    }

    private GeminiInput loadAsGeminiInput(Long sourceId) {
        LoadedSource loaded = sourceContentLoader.load(sourceId);
        SourceFormat format = SourceFormat.fromFilename(loaded.originalName());
        log.info("소스 로드: id={}, name={}, format={}, bytes={}",
                sourceId, loaded.originalName(), format, loaded.content().length);
        return switch (format) {
            case PDF -> GeminiInput.inlineData("application/pdf", loaded.content());
            case DOCX -> GeminiInput.text(documentApiClient.docxToHtml(loaded.content(), loaded.originalName()));
            case HWPX -> GeminiInput.text(documentApiClient.hwpxToHtml(loaded.content(), loaded.originalName()));
            case HTML -> null;
            case TEXT -> GeminiInput.text(new String(loaded.content(), StandardCharsets.UTF_8));
        };
    }

    private String convertTemplateToHtml(MemoSnapshot snapshot) {
        log.info("템플릿 파일 읽기: storedName={}", snapshot.templateStoredName());
        byte[] templateBytes = readUpload(snapshot.templateStoredName());
        log.info("템플릿 파일 읽기 완료: {}bytes, docxToHtml 호출 진입", templateBytes.length);
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
