package com.limecoding.core.memo.application;

public interface DocumentApiClient {
    String docxToHtml(byte[] docxBytes, String filename);

    String hwpxToHtml(byte[] hwpxBytes, String filename);

    String fillHtmlTopic(String htmlTemplate, String contentText, String topic, String systemPrompt);

    byte[] fillDocxHtml(byte[] docxTemplate, String filledHtml, String systemPrompt);
}
