package com.limecoding.core.chat.application;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatClientFactory {

    private static final String SYSTEM_PROMPT = """
            너는 auto-doc-gen 프로젝트의 어시스턴트야.
            사용자의 질문에 한국어로 간결하고 정확하게 답해.
            """;

    private final ChatClient.Builder builder;

    public ChatClient create() {
        return builder
                .defaultSystem(SYSTEM_PROMPT)
                .defaultAdvisors(retrievalAdvisors())
                .build();
    }

    /**
     * RAG 확장점. Phase 2에서 RetrievalAugmentationAdvisor 등을 여기에 추가.
     */
    private List<Advisor> retrievalAdvisors() {
        return List.of();
    }
}
