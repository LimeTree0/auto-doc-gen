package com.limecoding.core.memo.presentation.dto;

import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.memo.domain.MemoStatus;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
public class GetMemoResponse {
    private Long id;
    private MemoStatus status;
    private List<Long> sourceIds;
    private String prompt;
    private LocalDateTime createdAt;

    public static GetMemoResponse from(Memo memo) {
        return new GetMemoResponse(
                memo.getId(),
                memo.getStatus(),
                memo.getSourceIds(),
                memo.getPrompt(),
                memo.getCreatedAt()
        );
    }
}
