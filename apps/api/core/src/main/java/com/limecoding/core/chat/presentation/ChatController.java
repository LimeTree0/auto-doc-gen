package com.limecoding.core.chat.presentation;

import com.limecoding.core.chat.application.ChatService;
import com.limecoding.core.chat.application.ConversationService;
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
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
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
            summary = "채팅 SSE 스트림 (파일 첨부 가능)",
            description = """
                    유저 메시지(텍스트 + 선택적 파일)를 받아 어시스턴트 응답을 SSE로 스트리밍한다.
                    multipart/form-data 로 보내며 파트는 다음과 같다:
                    - content: 유저 메시지 텍스트 (필수)
                    - files: 첨부 파일들 (선택, 0개 이상). 첨부 시 LLM이 generateDocument 도구로 문서를 작성할 수 있다.

                    응답은 표준 ApiResponse envelope을 따르지 않고 전용 청크 모양을 보낸다:
                    - event: delta — { type: "delta", content: "..." }
                    - event: done  — { type: "done", messageId: 123 }
                    - event: error — { type: "error", error: "..." }
                    """
    )
    @PostMapping(
            value = "/{id}/messages",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE,
            produces = MediaType.TEXT_EVENT_STREAM_VALUE
    )
    public SseEmitter stream(
            @PathVariable Long id,
            @RequestParam("content") String content,
            @RequestPart(value = "files", required = false) List<MultipartFile> files
    ) {
        return chatService.stream(id, content, files);
    }
}
