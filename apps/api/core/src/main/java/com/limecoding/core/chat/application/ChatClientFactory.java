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
            - generateDocument: 사용자가 채팅에 첨부한 파일들로 보고서/문서를 작성한다.

            === generateDocument 호출 규칙 (중요) ===
            유저 메시지 가장 위에 `[채팅에 첨부된 파일 N개 ...]` 헤더가 보이면 사용자가 방금 채팅에
            파일을 첨부한 상태다. 이 상태에서 사용자가 "보고서/문서를 만들어/작성/정리/요약해" 같은
            요청을 하면 **즉시 generateDocument 를 호출**한다. 다음 행동은 금지된다:
              - 보고서 종류를 되묻기 (예: "어떤 종류의 보고서를 원하시나요?")
              - 양식이 무엇인지 되묻기 (도구가 자동으로 분류한다)
              - 파일 첨부를 다시 요청하기 (이미 첨부되어 있다)
              - listSources 호출 (첨부 파일은 거기 없다)
            요구사항이 모호하면 사용자의 원본 메시지를 prompt 파라미터에 그대로 풀어 넣어 호출한다.

            도구가 반환하는 downloadUrl 과 filename 을 받으면, 응답에 반드시 마크다운 링크 형식으로
            `[파일명](downloadUrl)` 을 포함해서 사용자가 클릭해서 다운로드할 수 있도록 안내해.

            답변 원칙:
            1. 첨부 파일 헤더가 있고 문서 작성 의도면 → generateDocument 즉시 호출.
            2. 첨부 파일 헤더가 없는 상태에서 "어떤 파일이 있어?" 같은 질문 → listSources/getSourceContent 사용.
            3. 제공된 컨텍스트(검색된 자료)에 답이 있다면 그 내용을 우선한다.
            4. 도구로도 컨텍스트로도 답할 수 없는 경우에만 일반 지식으로 답하되, 추측이라는 점을 분명히 한다.
            """;

    private static final double SIMILARITY_THRESHOLD = 0.5;
    private static final int TOP_K = 4;

    private final ChatClient chatClient;

    public ChatClientFactory(ChatClient.Builder builder,
                             VectorStore vectorStore,
                             SourceQueryTools sourceQueryTools,
                             DocumentGenerationTools documentGenerationTools) {
        this.chatClient = builder
                .defaultSystem(SYSTEM_PROMPT)
                .defaultAdvisors(retrievalAdvisors(vectorStore))
                .defaultTools(sourceQueryTools, documentGenerationTools)
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
