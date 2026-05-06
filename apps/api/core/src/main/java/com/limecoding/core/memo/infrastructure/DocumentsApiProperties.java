package com.limecoding.core.memo.infrastructure;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "documents.api")
public record DocumentsApiProperties(String baseUrl) {
}
