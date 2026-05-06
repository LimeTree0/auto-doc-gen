package com.limecoding.core.chat.application;

import com.limecoding.core.chat.domain.Conversation;
import com.limecoding.core.chat.domain.Message;
import com.limecoding.core.chat.domain.MessageRole;
import com.limecoding.core.chat.infrastructure.ConversationJpaRepository;
import com.limecoding.core.chat.infrastructure.MessageJpaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ConversationService {

    private final ConversationJpaRepository conversationRepository;
    private final MessageJpaRepository messageRepository;

    @Transactional
    public Conversation create(String title) {
        String resolvedTitle = (title == null || title.isBlank()) ? "새 대화" : title.trim();
        return conversationRepository.save(new Conversation(resolvedTitle));
    }

    @Transactional(readOnly = true)
    public List<Conversation> list() {
        return conversationRepository.findAllByOrderByUpdatedAtDesc();
    }

    @Transactional(readOnly = true)
    public Conversation get(Long id) {
        return conversationRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Conversation not found: " + id));
    }

    @Transactional(readOnly = true)
    public List<Message> history(Long conversationId) {
        ensureExists(conversationId);
        return messageRepository.findAllByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    @Transactional
    public Message appendUserMessage(Long conversationId, String content) {
        if (content == null || content.isBlank()) {
            throw new IllegalArgumentException("메시지 내용이 비어 있습니다");
        }
        Conversation conversation = get(conversationId);
        conversation.touch();
        return messageRepository.save(new Message(conversation.getId(), MessageRole.USER, content.trim()));
    }

    @Transactional
    public Message appendAssistantMessage(Long conversationId, String content) {
        Conversation conversation = get(conversationId);
        conversation.touch();
        return messageRepository.save(new Message(conversation.getId(), MessageRole.ASSISTANT, content));
    }

    private void ensureExists(Long conversationId) {
        if (!conversationRepository.existsById(conversationId)) {
            throw new IllegalArgumentException("Conversation not found: " + conversationId);
        }
    }
}
