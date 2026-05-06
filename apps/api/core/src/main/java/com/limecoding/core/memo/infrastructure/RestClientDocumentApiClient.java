package com.limecoding.core.memo.infrastructure;

import com.limecoding.core.memo.application.DocumentApiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "documents.api", name = "mock", havingValue = "false", matchIfMissing = true)
public class RestClientDocumentApiClient implements DocumentApiClient {

    private static final MediaType DOCX_MEDIA_TYPE =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");
    private static final MediaType HWPX_MEDIA_TYPE = MediaType.parseMediaType("application/hwp+zip");

    private final RestClient restClient;

    public RestClientDocumentApiClient(DocumentsApiProperties properties) {
        this.restClient = RestClient.builder()
                .baseUrl(properties.baseUrl())
                .build();
    }

    private static HttpEntity<byte[]> filePart(String formName, String filename, byte[] content, MediaType contentType) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(contentType);
        headers.setContentDispositionFormData(formName, filename);
        return new HttpEntity<>(content, headers);
    }

    @Override
    public String docxToHtml(byte[] docxBytes, String filename) {
        return convertToHtml("/api/documents/docx/to-html", docxBytes,
                filename != null ? filename : "input.docx", DOCX_MEDIA_TYPE);
    }

    @Override
    public String hwpxToHtml(byte[] hwpxBytes, String filename) {
        return convertToHtml("/api/documents/hwpx/to-html", hwpxBytes,
                filename != null ? filename : "input.hwpx", HWPX_MEDIA_TYPE);
    }

    @Override
    public String fillHtmlTopic(String htmlTemplate, String contentText, String topic, String systemPrompt) {
        MultiValueMap<String, HttpEntity<?>> body = new LinkedMultiValueMap<>();
        body.add("template", filePart("template", "template.html", htmlTemplate.getBytes(StandardCharsets.UTF_8), MediaType.TEXT_HTML));
        body.add("content", filePart("content", "content.txt", contentText.getBytes(StandardCharsets.UTF_8), MediaType.TEXT_PLAIN));

        log.info("DocumentApi 요청: fill-topic, template={}자, content={}자, topic={}",
                htmlTemplate.length(), contentText.length(), topic);
        log.info("DocumentApi 컨텐츠 요청: content={}", contentText);

        long startedAt = System.currentTimeMillis();
        try {
            String result = restClient.post()
                    .uri(uri -> uri.path("/api/documents/html/fill-topic")
                            .queryParam("topic", topic)
                            .queryParam("systemPrompt", systemPrompt == null ? "" : systemPrompt)
                            .build())
                    .accept(MediaType.TEXT_HTML)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            log.info("DocumentApi 응답: fill-topic, {}ms, 길이={}자",
                    System.currentTimeMillis() - startedAt, result == null ? 0 : result.length());
            return result;
        } catch (RestClientException e) {
            log.error("DocumentApi 실패: fill-topic, {}ms, message={}",
                    System.currentTimeMillis() - startedAt, e.getMessage());
            throw new RuntimeException("HTML 채우기 실패", e);
        }
    }

    @Override
    public byte[] fillDocxHtml(byte[] docxTemplate, String filledHtml, String systemPrompt) {
        MultiValueMap<String, HttpEntity<?>> body = new LinkedMultiValueMap<>();
        body.add("template", filePart("template", "template.docx", docxTemplate, DOCX_MEDIA_TYPE));
        body.add("html", filePart("html", "body.html", filledHtml.getBytes(StandardCharsets.UTF_8), MediaType.TEXT_HTML));

        log.info("DocumentApi 요청: fill-docx-html, template={}bytes, html={}자",
                docxTemplate.length, filledHtml.length());
        long startedAt = System.currentTimeMillis();
        try {
            byte[] result = restClient.post()
                    .uri(uri -> uri.path("/api/documents/docx/fill-html")
                            .queryParam("systemPrompt", systemPrompt == null ? "" : systemPrompt)
                            .build())
                    .accept(DOCX_MEDIA_TYPE)
                    .body(body)
                    .retrieve()
                    .body(byte[].class);
            log.info("DocumentApi 응답: fill-docx-html, {}ms, {}bytes",
                    System.currentTimeMillis() - startedAt, result == null ? 0 : result.length);
            return result;
        } catch (RestClientException e) {
            log.error("DocumentApi 실패: fill-docx-html, {}ms, message={}",
                    System.currentTimeMillis() - startedAt, e.getMessage());
            throw new RuntimeException("DOCX 채우기 실패", e);
        }
    }

    private String convertToHtml(String path, byte[] bytes, String filename, MediaType contentType) {
        log.info("convertToHtml 진입: path={}, filename={}, {}bytes", path, filename, bytes.length);
        MultiValueMap<String, HttpEntity<?>> body = new LinkedMultiValueMap<>();
        body.add("file", filePart("file", filename, bytes, contentType));
        log.info("Multipart part 구성 완료");

        log.info("DocumentApi 요청: {}, file={}, {}bytes", path, filename, bytes.length);
        long startedAt = System.currentTimeMillis();
        try {
            String result = restClient.post()
                    .uri(path)
                    .accept(MediaType.TEXT_HTML)
                    .body(body)
                    .retrieve()
                    .body(String.class);
            log.info("DocumentApi 응답: {}, {}ms, 길이={}자",
                    path, System.currentTimeMillis() - startedAt, result == null ? 0 : result.length());
            return result;
        } catch (RestClientException e) {
            log.error("DocumentApi 실패: {}, {}ms, message={}",
                    path, System.currentTimeMillis() - startedAt, e.getMessage());
            throw new RuntimeException("문서 변환 실패: " + path, e);
        } catch (Throwable t) {
            log.error("DocumentApi 비정상 종료: {}, {}ms", path, System.currentTimeMillis() - startedAt, t);
            throw t;
        }
    }
}
