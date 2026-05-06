package com.limecoding.core.memo.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@NoArgsConstructor
@Entity
public class Memo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private MemoStatus status;

    @Column(length = 4000)
    private String prompt;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "memo_source_ids", joinColumns = @JoinColumn(name = "memo_id"))
    @Column(name = "source_id")
    private List<Long> sourceIds = new ArrayList<>();

    private String templateStoredName;
    private String templateOriginalName;
    private String resultStoredName;
    private String cachedDocxStoredName;
    private LocalDateTime createdAt;

    public Memo(List<Long> sourceIds, String prompt, String templateStoredName, String templateOriginalName) {
        this.sourceIds = new ArrayList<>(sourceIds);
        this.prompt = prompt;
        this.templateStoredName = templateStoredName;
        this.templateOriginalName = templateOriginalName;
        this.status = MemoStatus.PENDING;
        this.createdAt = LocalDateTime.now();
    }

    public void markInProgress() {
        this.status = MemoStatus.IN_PROGRESS;
    }

    public void markCompleted(String resultStoredName) {
        this.status = MemoStatus.COMPLETED;
        this.resultStoredName = resultStoredName;
    }

    public void markDocxCached(String cachedDocxStoredName) {
        this.cachedDocxStoredName = cachedDocxStoredName;
    }

    public void markFailed() {
        this.status = MemoStatus.FAILED;
    }
}
