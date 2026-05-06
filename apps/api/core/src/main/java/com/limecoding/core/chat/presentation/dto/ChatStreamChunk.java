package com.limecoding.core.chat.presentation.dto;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * SSE 스트림 청크. 표준 ApiResponse 규약 예외 — 스트리밍 전용 모양.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ChatStreamChunk(String type, String content, Long messageId, String error) {

    public static ChatStreamChunk delta(String content) {
        return new ChatStreamChunk("delta", content, null, null);
    }

    public static ChatStreamChunk done(Long messageId) {
        return new ChatStreamChunk("done", null, messageId, null);
    }

    public static ChatStreamChunk error(String message) {
        return new ChatStreamChunk("error", null, null, message);
    }
}
