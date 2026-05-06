package com.limecoding.core.memo.application;

import java.util.Locale;

public enum SourceFormat {
    PDF,
    DOCX,
    HWPX,
    HTML,
    TEXT;

    public static SourceFormat fromFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            throw new IllegalArgumentException("파일명이 비어 있어 형식을 판단할 수 없습니다");
        }
        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".pdf")) return PDF;
        if (lower.endsWith(".docx")) return DOCX;
        if (lower.endsWith(".hwpx")) return HWPX;
        if (lower.endsWith(".html") || lower.endsWith(".htm")) return HTML;
        if (lower.endsWith(".txt") || lower.endsWith(".md")) {
            return TEXT;
        }
        throw new IllegalArgumentException("지원하지 않는 파일 형식: " + filename);
    }
}
