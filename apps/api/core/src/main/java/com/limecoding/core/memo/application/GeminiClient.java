package com.limecoding.core.memo.application;

import java.util.List;

public interface GeminiClient {
    String generate(List<GeminiInput> inputs, String systemInstruction);
}
