package com.limecoding.core.memo.infrastructure;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.limecoding.core.memo.application.GeminiClient;
import com.limecoding.core.memo.application.GeminiInput;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Slf4j
@Component
public class RestClientGeminiClient implements GeminiClient {

    private final RestClient restClient;
    private final GeminiProperties properties;

    public RestClientGeminiClient(GeminiProperties properties) {
        this.properties = properties;
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .build();
    }

    @Override
    public String generate(List<GeminiInput> inputs, String systemInstruction) {
        Map<String, Object> body = new HashMap<>();
        body.put("systemInstruction", Map.of("parts", List.of(Map.of("text", systemInstruction))));
        body.put("contents", List.of(Map.of(
                "role", "user",
                "parts", buildParts(inputs)
        )));

        try {
            GenerateContentResponse response = restClient.post()
                    .uri("/models/{model}:generateContent?key={key}", properties.model(), properties.apiKey())
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(body)
                    .retrieve()
                    .body(GenerateContentResponse.class);

            if (response == null || response.candidates() == null || response.candidates().isEmpty()) {
                throw new RuntimeException("Gemini 응답이 비어 있습니다");
            }
            GenerateContentResponse.Content content = response.candidates().get(0).content();
            if (content == null || content.parts() == null) {
                throw new RuntimeException("Gemini 응답 본문이 비어 있습니다");
            }
            return content.parts().stream()
                    .map(GenerateContentResponse.Part::text)
                    .filter(Objects::nonNull)
                    .collect(Collectors.joining());
        } catch (RestClientException e) {
            throw new RuntimeException("Gemini 호출 실패", e);
        }
    }

    private List<Map<String, Object>> buildParts(List<GeminiInput> inputs) {
        return inputs.stream()
                .map(input -> switch (input) {
                    case GeminiInput.Text(String value) -> Map.<String, Object>of("text", value);
                    case GeminiInput.InlineData(String mimeType, byte[] content) -> Map.<String, Object>of(
                            "inlineData", Map.of(
                                    "mimeType", mimeType,
                                    "data", Base64.getEncoder().encodeToString(content)
                            )
                    );
                })
                .toList();
    }

    @JsonIgnoreProperties(ignoreUnknown = true)
    public record GenerateContentResponse(List<Candidate> candidates) {
        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Candidate(Content content) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Content(List<Part> parts) {
        }

        @JsonIgnoreProperties(ignoreUnknown = true)
        public record Part(String text) {
        }
    }
}
