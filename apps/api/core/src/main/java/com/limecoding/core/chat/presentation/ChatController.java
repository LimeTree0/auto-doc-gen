package com.limecoding.core.chat.presentation;

import com.limecoding.core.chat.application.ChatService;
import com.limecoding.core.chat.application.ConversationService;
import com.limecoding.core.chat.presentation.dto.ChatStreamRequest;
import com.limecoding.core.chat.presentation.dto.ConversationResponse;
import com.limecoding.core.chat.presentation.dto.CreateConversationRequest;
import com.limecoding.core.chat.presentation.dto.MessageResponse;
import com.limecoding.core.common.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.util.List;

@RestController
@RequestMapping("/api/v1/chat/conversations")
@RequiredArgsConstructor
public class ChatController {

    private final ConversationService conversationService;
    private final ChatService chatService;

    @PostMapping
    public ApiResponse<ConversationResponse> create(@RequestBody(required = false) CreateConversationRequest request) {
        String title = request == null ? null : request.title();
        return ApiResponse.success(ConversationResponse.from(conversationService.create(title)));
    }

    @GetMapping
    public ApiResponse<List<ConversationResponse>> list() {
        List<ConversationResponse> result = conversationService.list().stream()
                .map(ConversationResponse::from)
                .toList();
        return ApiResponse.success(result);
    }

    @GetMapping("/{id}")
    public ApiResponse<ConversationResponse> get(@PathVariable Long id) {
        return ApiResponse.success(ConversationResponse.from(conversationService.get(id)));
    }

    @GetMapping("/{id}/messages")
    public ApiResponse<List<MessageResponse>> messages(@PathVariable Long id) {
        List<MessageResponse> result = conversationService.history(id).stream()
                .map(MessageResponse::from)
                .toList();
        return ApiResponse.success(result);
    }

    @Operation(
            summary = "채팅 SSE 스트림",
            description = """
                    유저 메시지를 받아 어시스턴트 응답을 SSE로 스트리밍한다.
                    표준 ApiResponse envelope을 따르지 않고 전용 청크 모양을 보낸다:
                    - event: delta — { type: "delta", content: "..." }
                    - event: done  — { type: "done", messageId: 123 }
                    - event: error — { type: "error", error: "..." }
                    """
    )
    @PostMapping(value = "/{id}/messages", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter stream(@PathVariable Long id, @RequestBody ChatStreamRequest request) {
        return chatService.stream(id, request.content());
    }
}
