package com.limecoding.core.memo.application;

import java.util.Locale;

public enum SourceFormat {
    PDF,
    DOCX,
    HWPX,
    HTML,
    TEXT,
    AUDIO_M4A,
    AUDIO_MP3;

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
        if (lower.endsWith(".m4a")) return AUDIO_M4A;
        if (lower.endsWith(".mp3")) return AUDIO_MP3;
        throw new IllegalArgumentException("지원하지 않는 파일 형식: " + filename);
    }

    public boolean isAudio() {
        return this == AUDIO_M4A || this == AUDIO_MP3;
    }

    public boolean isTemplateCapable() {
        // 양식(템플릿)으로 사용할 수 있는 포맷. 음성은 양식이 될 수 없다.
        return !isAudio();
    }
}
