package com.limecoding.core.chat.application;

import com.limecoding.core.chat.domain.Message;
import com.limecoding.core.chat.presentation.dto.ChatStreamChunk;
import com.limecoding.core.memo.application.UploadedFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Consumer;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    // 동기 도구 호출(generateDocument)이 메모 완료까지 폴링하는 동안 SSE가 살아있어야 한다.
    // 메모 생성은 보통 수십초~수분 걸리므로 충분한 여유를 둔다.
    private static final long EMITTER_TIMEOUT_MS = 10 * 60 * 1000L;
    static final String TOOL_CONTEXT_FILES_KEY = "uploadedFiles";
    static final String TOOL_CONTEXT_PROGRESS_KEY = "progressEmitter";

    private final ConversationService conversationService;
    private final ChatClientFactory chatClientFactory;

    public SseEmitter stream(Long conversationId, String userContent, List<MultipartFile> files) {
        List<UploadedFile> uploadedFiles = readFiles(files);

        // 사용자 메시지는 원문 그대로 DB 에 저장 (UI 표시용).
        conversationService.appendUserMessage(conversationId, userContent);
        List<Message> history = conversationService.history(conversationId);

        // LLM 에게는 첨부 파일 정보를 마지막 유저 메시지에 prepend 해서 전달한다.
        // 이렇게 해야 LLM 이 "파일이 있으니 generateDocument 도구를 호출해야겠다" 라고 판단할 수 있다.
        List<org.springframework.ai.chat.messages.Message> aiMessages =
                toAiMessages(history, uploadedFiles);

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        StringBuilder buffer = new StringBuilder();
        ChatClient client = chatClientFactory.create();

        // 도구가 호출 boundary 마다 progress 를 SSE 로 흘려보내기 위한 콜백.
        // SSE 가 이미 닫혔거나 전송 실패해도 도구 자체는 진행되도록 예외는 무시한다.
        Consumer<String> progressEmitter = label -> {
            if (label == null || label.isBlank()) {
                return;
            }
            try {
                emitter.send(SseEmitter.event()
                        .name("step")
                        .data(ChatStreamChunk.step(label)));
            } catch (Exception e) {
                log.debug("[Chat:{}] step 이벤트 전송 무시: {}", conversationId, e.getMessage());
            }
        };

        log.info("[Chat:{}] 스트림 시작, 첨부 파일={}건", conversationId, uploadedFiles.size());

        Disposable subscription = client.prompt()
                .messages(aiMessages)
                .toolContext(Map.of(
                        TOOL_CONTEXT_FILES_KEY, uploadedFiles,
                        TOOL_CONTEXT_PROGRESS_KEY, progressEmitter
                ))
                .stream()
                .content()
                .doOnNext(chunk -> emitDelta(emitter, buffer, chunk))
                .doOnComplete(() -> handleComplete(emitter, conversationId, buffer))
                .doOnError(error -> handleError(emitter, conversationId, error))
                .subscribe();

        emitter.onTimeout(subscription::dispose);
        emitter.onCompletion(subscription::dispose);
        emitter.onError(error -> subscription.dispose());

        return emitter;
    }

    private void emitDelta(SseEmitter emitter, StringBuilder buffer, String chunk) {
        if (chunk == null || chunk.isEmpty()) {
            return;
        }
        buffer.append(chunk);
        try {
            emitter.send(SseEmitter.event()
                    .name("delta")
                    .data(ChatStreamChunk.delta(chunk)));
        } catch (IOException e) {
            throw new IllegalStateException("SSE delta 전송 실패", e);
        }
    }

    private void handleComplete(SseEmitter emitter, Long conversationId, StringBuilder buffer) {
        String full = buffer.toString();
        try {
            Message saved = conversationService.appendAssistantMessage(conversationId, full);
            emitter.send(SseEmitter.event()
                    .name("done")
                    .data(ChatStreamChunk.done(saved.getId())));
            emitter.complete();
            log.info("[Chat:{}] 스트림 완료, 응답 길이={}자", conversationId, full.length());
        } catch (IOException e) {
            log.error("[Chat:{}] done 이벤트 전송 실패", conversationId, e);
            emitter.completeWithError(e);
        }
    }

    private void handleError(SseEmitter emitter, Long conversationId, Throwable error) {
        log.error("[Chat:{}] 스트림 실패", conversationId, error);
        try {
            emitter.send(SseEmitter.event()
                    .name("error")
                    .data(ChatStreamChunk.error(error.getMessage())));
        } catch (IOException ignored) {
        }
        emitter.completeWithError(error);
    }

    private List<UploadedFile> readFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }
        List<UploadedFile> result = new ArrayList<>(files.size());
        for (int i = 0; i < files.size(); i++) {
            MultipartFile file = files.get(i);
            if (file == null || file.isEmpty()) {
                continue;
            }
            String filename = Optional.ofNullable(file.getOriginalFilename())
                    .filter(name -> !name.isBlank())
                    .orElse("file_" + i);
            try {
                result.add(new UploadedFile(filename, file.getBytes()));
            } catch (IOException e) {
                throw new IllegalStateException("첨부 파일 읽기 실패: " + filename, e);
            }
        }
        return result;
    }

    private List<org.springframework.ai.chat.messages.Message> toAiMessages(
            List<Message> history,
            List<UploadedFile> attachedFiles
    ) {
        List<org.springframework.ai.chat.messages.Message> result = new ArrayList<>(history.size());
        for (int i = 0; i < history.size(); i++) {
            Message message = history.get(i);
            boolean isLastUser = (i == history.size() - 1)
                    && message.getRole() == com.limecoding.core.chat.domain.MessageRole.USER;
            String content = isLastUser
                    ? augmentWithFileContext(message.getContent(), attachedFiles)
                    : message.getContent();
            result.add(toAiMessage(message.getRole(), content));
        }
        return result;
    }

    private String augmentWithFileContext(String content, List<UploadedFile> files) {
        if (files == null || files.isEmpty()) {
            return content;
        }
        StringBuilder header = new StringBuilder();
        header.append("[채팅에 첨부된 파일 ").append(files.size()).append("개")
                .append(" — generateDocument 도구가 사용할 수 있는 입력]\n");
        for (int i = 0; i < files.size(); i++) {
            header.append(i + 1).append(". ").append(files.get(i).filename()).append('\n');
        }
        header.append('\n');
        return header + (content == null ? "" : content);
    }

    private org.springframework.ai.chat.messages.Message toAiMessage(
            com.limecoding.core.chat.domain.MessageRole role,
            String content
    ) {
        return switch (role) {
            case USER -> new UserMessage(content);
            case ASSISTANT -> new AssistantMessage(content);
            case SYSTEM -> new SystemMessage(content);
        };
    }
}
