package com.limecoding.core.memo.infrastructure;

import com.limecoding.core.memo.application.DocumentApiClient;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@ConditionalOnProperty(prefix = "documents.api", name = "mock", havingValue = "true")
public class MockDocumentApiClient implements DocumentApiClient {

    @PostConstruct
    void announce() {
        log.warn("[MockDocApi] documents.api.mock=true 설정으로 인해 실제 문서 API 대신 MockDocumentApiClient 가 사용됩니다.");
    }

    @Override
    public String docxToHtml(byte[] docxBytes, String filename) {
        log.info("[MockDocApi] docxToHtml: name={}, {}bytes", filename, docxBytes.length);
        return stubHtml("DOCX → HTML", filename, docxBytes.length);
    }

    @Override
    public String hwpxToHtml(byte[] hwpxBytes, String filename) {
        log.info("[MockDocApi] hwpxToHtml: name={}, {}bytes", filename, hwpxBytes.length);
        return stubHtml("HWPX → HTML", filename, hwpxBytes.length);
    }

    @Override
    public String fillHtmlTopic(String htmlTemplate, String contentText, String topic, String systemPrompt) {
        log.info("[MockDocApi] fillHtmlTopic: topic={}, content={}자, template={}자",
                topic, contentText.length(), htmlTemplate.length());
        String snippet = contentText.length() > 400
                ? contentText.substring(0, 400) + "..."
                : contentText;
        return """
                <html><body>
                <h1>[MOCK] %s</h1>
                <p>이 문서는 documents.api.mock=true 설정에 의해 MockDocumentApiClient 가 만든 더미 결과물입니다.</p>
                <h2>입력 컨텐츠 일부</h2>
                <pre>%s</pre>
                <p>템플릿 길이: %d자, 시스템 프롬프트 길이: %d자</p>
                </body></html>
                """.formatted(
                escape(topic),
                escape(snippet),
                htmlTemplate.length(),
                systemPrompt == null ? 0 : systemPrompt.length());
    }

    @Override
    public byte[] fillDocxHtml(byte[] docxTemplate, String filledHtml, String systemPrompt) {
        log.info("[MockDocApi] fillDocxHtml: template={}bytes, html={}자",
                docxTemplate.length, filledHtml.length());
        return docxTemplate;
    }

    private static String stubHtml(String label, String filename, int byteCount) {
        return """
                <html><body>
                <h1>[MOCK] %s</h1>
                <p>원본 파일명: %s</p>
                <p>원본 크기: %d bytes</p>
                <p>이 HTML 은 documents.api.mock=true 설정 때문에 MockDocumentApiClient 가 반환한 더미 응답입니다.</p>
                </body></html>
                """.formatted(escape(label), escape(filename == null ? "(unknown)" : filename), byteCount);
    }

    private static String escape(String s) {
        if (s == null) {
            return "";
        }
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
