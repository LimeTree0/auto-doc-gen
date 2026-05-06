package com.limecoding.core.memo.application;

import org.springframework.stereotype.Component;

@Component
public class TopicExtractor {

    public String fromTemplateFilename(String templateFilename) {
        if (templateFilename == null || templateFilename.isBlank()) {
            return "문서";
        }
        int lastDot = templateFilename.lastIndexOf('.');
        return lastDot > 0 ? templateFilename.substring(0, lastDot) : templateFilename;
    }
}
