package com.limecoding.core.source.domain;

import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Getter
@ToString
@NoArgsConstructor
@Entity
public class Source {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String storedName;
    private String originalName;

    @Enumerated(EnumType.STRING)
    private SourceEmbeddingStatus embeddingStatus;

    private Integer embeddedChunkCount;

    public Source(String storedName, String originalName) {
        this.storedName = storedName;
        this.originalName = originalName;
        this.embeddingStatus = SourceEmbeddingStatus.PENDING;
    }

    public void markEmbeddingInProgress() {
        this.embeddingStatus = SourceEmbeddingStatus.IN_PROGRESS;
    }

    public void markEmbeddingCompleted(int chunkCount) {
        this.embeddingStatus = SourceEmbeddingStatus.COMPLETED;
        this.embeddedChunkCount = chunkCount;
    }

    public void markEmbeddingFailed() {
        this.embeddingStatus = SourceEmbeddingStatus.FAILED;
    }
}
