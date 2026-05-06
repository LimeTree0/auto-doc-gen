package com.limecoding.core.memo.application;

public sealed interface GeminiInput {

    record Text(String value) implements GeminiInput {
    }

    record InlineData(String mimeType, byte[] content) implements GeminiInput {
    }

    static GeminiInput text(String value) {
        return new Text(value);
    }

    static GeminiInput inlineData(String mimeType, byte[] content) {
        return new InlineData(mimeType, content);
    }
}
