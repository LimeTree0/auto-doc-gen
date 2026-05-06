package com.limecoding.core.memo.infrastructure;

import com.limecoding.core.memo.application.DocumentApiClient;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

import java.nio.charset.StandardCharsets;

@Slf4j
@Component
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
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("template", htmlTemplate.getBytes(StandardCharsets.UTF_8))
                .filename("template.html")
                .contentType(MediaType.TEXT_HTML);
        builder.part("content", contentText.getBytes(StandardCharsets.UTF_8))
                .filename("content.md")
                .contentType(MediaType.TEXT_PLAIN);

        try {
            return restClient.post()
                    .uri(uri -> uri.path("/api/documents/html/fill-topic")
                            .queryParam("topic", topic)
                            .queryParam("systemPrompt", systemPrompt == null ? "" : systemPrompt)
                            .build())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(builder.build())
                    .retrieve()
                    .body(String.class);
        } catch (RestClientException e) {
            throw new RuntimeException("HTML 채우기 실패", e);
        }
    }

    @Override
    public byte[] fillDocxHtml(byte[] docxTemplate, String filledHtml, String systemPrompt) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("template", docxTemplate)
                .filename("template.docx")
                .contentType(DOCX_MEDIA_TYPE);
        builder.part("html", filledHtml.getBytes(StandardCharsets.UTF_8))
                .filename("body.html")
                .contentType(MediaType.TEXT_HTML);

        try {
            return restClient.post()
                    .uri(uri -> uri.path("/api/documents/docx/fill-html")
                            .queryParam("systemPrompt", systemPrompt == null ? "" : systemPrompt)
                            .build())
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(builder.build())
                    .retrieve()
                    .body(byte[].class);
        } catch (RestClientException e) {
            throw new RuntimeException("DOCX 채우기 실패", e);
        }
    }

    private String convertToHtml(String path, byte[] bytes, String filename, MediaType contentType) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        builder.part("file", bytes)
                .filename(filename)
                .contentType(contentType);

        try {
            return restClient.post()
                    .uri(path)
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(builder.build())
                    .retrieve()
                    .body(String.class);
        } catch (RestClientException e) {
            throw new RuntimeException("문서 변환 실패: " + path, e);
        }
    }
}
