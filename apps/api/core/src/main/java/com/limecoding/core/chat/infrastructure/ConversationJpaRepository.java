package com.limecoding.core.chat.infrastructure;

import com.limecoding.core.chat.domain.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ConversationJpaRepository extends JpaRepository<Conversation, Long> {
    List<Conversation> findAllByOrderByUpdatedAtDesc();
}
