package com.limecoding.core.chat.presentation.dto;

import com.limecoding.core.chat.domain.Message;
import com.limecoding.core.chat.domain.MessageRole;

import java.time.LocalDateTime;

public record MessageResponse(
        Long id,
        Long conversationId,
        MessageRole role,
        String content,
        LocalDateTime createdAt
) {
    public static MessageResponse from(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getConversationId(),
                message.getRole(),
                message.getContent(),
                message.getCreatedAt()
        );
    }
}
