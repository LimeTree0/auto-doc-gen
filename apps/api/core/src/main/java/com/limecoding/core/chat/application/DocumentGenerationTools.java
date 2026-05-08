package com.limecoding.core.chat.application;

import com.limecoding.core.memo.application.MemoAutoCreationService;
import com.limecoding.core.memo.application.MemoProgressBus;
import com.limecoding.core.memo.application.MemoService;
import com.limecoding.core.memo.application.UploadedFile;
import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.memo.domain.MemoStatus;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.model.ToolContext;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.function.Consumer;

@Slf4j
@Component
public class DocumentGenerationTools {

    // 음성 자료가 들어오면 Gemini 처리가 텍스트보다 훨씬 길어진다.
    // SseEmitter timeout(10분) 보다 살짝 짧게 잡아 emitter 가 먼저 닫히지 않도록 한다.
    private static final Duration MAX_WAIT = Duration.ofMinutes(8);
    private static final Duration POLL_INTERVAL = Duration.ofMillis(800);
    private static final Consumer<String> NOOP_PROGRESS = step -> {};

    private final MemoAutoCreationService memoAutoCreationService;
    private final MemoService memoService;
    private final MemoProgressBus progressBus;
    private final String publicBaseUrl;

    public DocumentGenerationTools(MemoAutoCreationService memoAutoCreationService,
                                   MemoService memoService,
                                   MemoProgressBus progressBus,
                                   @Value("${app.public-base-url}") String publicBaseUrl) {
        this.memoAutoCreationService = memoAutoCreationService;
        this.memoService = memoService;
        this.progressBus = progressBus;
        this.publicBaseUrl = trimTrailingSlash(publicBaseUrl);
    }

    public record DocumentResult(Long memoId, String downloadUrl, String filename, String status) {}

    @Tool(description = """
            사용자가 채팅에 첨부한 파일들(양식 1개 + 자료 N개)을 사용해 보고서/문서를 작성한다.
            - 사용자가 파일을 첨부하고 "작성해줘", "보고서 만들어줘", "정리해줘" 같이 요청할 때 호출한다.
            - 첨부 파일이 1개면 그 파일을 양식으로 간주하고 자료 없이 진행한다.
            - 첨부 파일이 2개 이상이면 자동으로 양식과 자료를 분류한다.
            - prompt 에는 사용자의 요구사항(어떤 보고서를 원하는지, 강조 사항 등)을 한국어로 풀어서 전달한다.
            - 도구는 문서 작성이 완료될 때까지 대기한 뒤, 다운로드 URL과 파일명을 반환한다.
            - 반환받은 downloadUrl 은 반드시 마크다운 링크 형식 `[파일명](downloadUrl)` 으로 응답에 포함해
              사용자가 클릭해서 다운로드할 수 있게 한다.
            """)
    public DocumentResult generateDocument(
            @ToolParam(description = "보고서/문서 작성 시 반영할 사용자 요구사항을 한국어로 풀어서 작성") String prompt,
            ToolContext toolContext
    ) {
        List<UploadedFile> files = readFilesFromContext(toolContext);
        if (files.isEmpty()) {
            throw new IllegalStateException("첨부된 파일이 없습니다. 사용자에게 양식 또는 자료 파일을 첨부하도록 안내하세요.");
        }
        Consumer<String> progress = readProgressFromContext(toolContext);
        log.info("[Tool:generateDocument] 호출, 파일 {}건, promptLen={}",
                files.size(), prompt == null ? 0 : prompt.length());

        Memo memo = memoAutoCreationService.createFromUploaded(files, prompt == null ? "" : prompt, progress);
        log.info("[Tool:generateDocument] 메모 enqueue 완료, memoId={}", memo.getId());

        try {
            Memo done = waitForCompletion(memo.getId(), progress);
            if (done.getStatus() == MemoStatus.FAILED) {
                throw new IllegalStateException("문서 생성에 실패했습니다 (memoId=" + done.getId() + ")");
            }

            // 다운로드 링크 첫 클릭 시 documents API 호출로 발생하는 추가 지연을 제거하기 위해
            // 도구 호출 안에서 DOCX 캐시를 미리 워밍업해둔다. 변환이 실패하면 어차피 클릭해도
            // 실패할 작업이므로, 여기서 즉시 실패 처리해 LLM이 사용자에게 알리도록 한다.
            progress.accept("DOCX 변환 중...");
            try {
                memoService.downloadDocx(done.getId());
                log.info("[Tool:generateDocument] DOCX 캐시 워밍업 완료, memoId={}", done.getId());
            } catch (RuntimeException e) {
                throw new IllegalStateException(
                        "문서 DOCX 변환에 실패했습니다 (memoId=" + done.getId() + "): " + e.getMessage(), e);
            }

            String filename = done.getTemplateOriginalName() == null
                    ? "document.docx"
                    : replaceExtension(done.getTemplateOriginalName(), ".docx");
            String downloadUrl = publicBaseUrl + "/api/v1/memos/" + done.getId() + "/docx";
            log.info("[Tool:generateDocument] 완료, memoId={}, downloadUrl={}", done.getId(), downloadUrl);

            return new DocumentResult(done.getId(), downloadUrl, filename, done.getStatus().name());
        } finally {
            progressBus.clear(memo.getId());
        }
    }

    private static String trimTrailingSlash(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url;
    }

    @SuppressWarnings("unchecked")
    private List<UploadedFile> readFilesFromContext(ToolContext toolContext) {
        if (toolContext == null) {
            return List.of();
        }
        Object value = toolContext.getContext().get(ChatService.TOOL_CONTEXT_FILES_KEY);
        if (value == null) {
            return List.of();
        }
        return (List<UploadedFile>) value;
    }

    @SuppressWarnings("unchecked")
    private Consumer<String> readProgressFromContext(ToolContext toolContext) {
        if (toolContext == null) {
            return NOOP_PROGRESS;
        }
        Object value = toolContext.getContext().get(ChatService.TOOL_CONTEXT_PROGRESS_KEY);
        if (!(value instanceof Consumer)) {
            return NOOP_PROGRESS;
        }
        return (Consumer<String>) value;
    }

    private Memo waitForCompletion(Long memoId, Consumer<String> progress) {
        Instant deadline = Instant.now().plus(MAX_WAIT);
        String lastEmitted = null;
        while (true) {
            Memo memo = memoService.getMemo(memoId);
            MemoStatus status = memo.getStatus();

            // 워커가 발행한 최신 단계가 직전과 다르면 SSE 로 흘려보낸다.
            Optional<String> latest = progressBus.peek(memoId);
            if (latest.isPresent() && !latest.get().equals(lastEmitted)) {
                progress.accept(latest.get());
                lastEmitted = latest.get();
            }

            if (status == MemoStatus.COMPLETED || status == MemoStatus.FAILED) {
                return memo;
            }
            if (Instant.now().isAfter(deadline)) {
                throw new IllegalStateException(
                        "문서 생성 대기 시간 초과 (memoId=" + memoId + ", status=" + status + ")");
            }
            try {
                Thread.sleep(POLL_INTERVAL.toMillis());
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new IllegalStateException("문서 생성 대기 중 인터럽트", e);
            }
        }
    }

    private String replaceExtension(String filename, String newExtension) {
        int dot = filename.lastIndexOf('.');
        return dot < 0 ? filename + newExtension : filename.substring(0, dot) + newExtension;
    }
}
