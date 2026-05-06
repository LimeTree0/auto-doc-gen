package com.limecoding.core.chat.application;

import com.limecoding.core.chat.domain.Message;
import com.limecoding.core.chat.presentation.dto.ChatStreamChunk;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.messages.AssistantMessage;
import org.springframework.ai.chat.messages.SystemMessage;
import org.springframework.ai.chat.messages.UserMessage;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;
import reactor.core.Disposable;

import java.io.IOException;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private static final long EMITTER_TIMEOUT_MS = 5 * 60 * 1000L;

    private final ConversationService conversationService;
    private final ChatClientFactory chatClientFactory;

    public SseEmitter stream(Long conversationId, String userContent) {
        conversationService.appendUserMessage(conversationId, userContent);
        List<Message> history = conversationService.history(conversationId);
        List<org.springframework.ai.chat.messages.Message> aiMessages = toAiMessages(history);

        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        StringBuilder buffer = new StringBuilder();
        ChatClient client = chatClientFactory.create();

        Disposable subscription = client.prompt()
                .messages(aiMessages)
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

    private List<org.springframework.ai.chat.messages.Message> toAiMessages(List<Message> history) {
        return history.stream()
                .map(this::toAiMessage)
                .toList();
    }

    private org.springframework.ai.chat.messages.Message toAiMessage(Message message) {
        return switch (message.getRole()) {
            case USER -> new UserMessage(message.getContent());
            case ASSISTANT -> new AssistantMessage(message.getContent());
            case SYSTEM -> new SystemMessage(message.getContent());
        };
    }
}
