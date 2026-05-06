package com.limecoding.core.chat.infrastructure;

import com.limecoding.core.chat.domain.Message;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MessageJpaRepository extends JpaRepository<Message, Long> {
    List<Message> findAllByConversationIdOrderByCreatedAtAsc(Long conversationId);
}
