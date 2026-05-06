package com.limecoding.core.chat.application;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.client.advisor.api.Advisor;
import org.springframework.ai.chat.client.advisor.vectorstore.QuestionAnswerAdvisor;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class ChatClientFactory {

    private static final String SYSTEM_PROMPT = """
            너는 auto-doc-gen 프로젝트의 어시스턴트야.
            사용자의 질문에 한국어로 간결하고 정확하게 답해.

            이용 가능한 도구:
            - listSources: 등록된 자료(파일)의 목록과 id 를 조회한다.
              "어떤 파일이 있어?", "등록된 자료 알려줘" 같은 질문이나, 특정 파일명을 id 로 변환할 때 사용해.
            - getSourceContent: 특정 자료의 전체 텍스트를 가져온다. id 가 필요하면 먼저 listSources 를 호출해.
              사용자가 특정 파일의 내용 자체를 알고 싶어 하거나, 검색된 컨텍스트만으로 답하기 어려울 때 사용해.

            답변 원칙:
            1. 제공된 컨텍스트(검색된 자료)에 답이 있다면 그 내용을 우선한다.
            2. "어떤 파일이 있는지" 또는 "특정 파일의 내용" 을 묻는 질문은 위 도구를 호출해 답한다.
            3. 도구로도 컨텍스트로도 답할 수 없는 경우에만 일반 지식으로 답하되, 추측이라는 점을 분명히 한다.
            """;

    private static final double SIMILARITY_THRESHOLD = 0.5;
    private static final int TOP_K = 4;

    private final ChatClient chatClient;

    public ChatClientFactory(ChatClient.Builder builder,
                             VectorStore vectorStore,
                             SourceQueryTools sourceQueryTools) {
        this.chatClient = builder
                .defaultSystem(SYSTEM_PROMPT)
                .defaultAdvisors(retrievalAdvisors(vectorStore))
                .defaultTools(sourceQueryTools)
                .build();
    }

    public ChatClient create() {
        return chatClient;
    }

    private static List<Advisor> retrievalAdvisors(VectorStore vectorStore) {
        Advisor rag = QuestionAnswerAdvisor.builder(vectorStore)
                .searchRequest(SearchRequest.builder()
                        .topK(TOP_K)
                        .similarityThreshold(SIMILARITY_THRESHOLD)
                        .build())
                .build();
        return List.of(rag);
    }
}
