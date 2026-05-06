package com.limecoding.core.memo.application;

import java.util.List;

public interface DocumentGenerationClient {
    byte[] generate(List<byte[]> sourceFiles, byte[] template, String prompt);
}
