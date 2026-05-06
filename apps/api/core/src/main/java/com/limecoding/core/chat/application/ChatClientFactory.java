package com.limecoding.core.chat.application;

import lombok.RequiredArgsConstructor;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
@RequiredArgsConstructor
public class ChatClientFactory {

    private static final String SYSTEM_PROMPT = """
            너는 auto-doc-gen 프로젝트의 어시스턴트야.
            사용자의 질문에 한국어로 간결하고 정확하게 답해.
            제공된 컨텍스트(검색된 자료)에 답이 있다면 그 내용을 우선해서 답하고,
            컨텍스트로 답할 수 없는 경우에는 아는 범위에서 답하되 추측이라는 점을 분명히 해.
            """;

    private static final double SIMILARITY_THRESHOLD = 0.5;
    private static final int TOP_K = 4;

    private final ChatClient.Builder builder;
    private final VectorStore vectorStore;

    public ChatClient create() {
        return builder
                .defaultSystem(SYSTEM_PROMPT)
                .defaultAdvisors(retrievalAdvisors())
                .build();
    }

    private List<Advisor> retrievalAdvisors() {
        Advisor rag = QuestionAnswerAdvisor.builder(vectorStore)
                .searchRequest(SearchRequest.builder()
                        .topK(TOP_K)
                        .similarityThreshold(SIMILARITY_THRESHOLD)
                        .build())
                .build();
        return List.of(rag);
    }
}
