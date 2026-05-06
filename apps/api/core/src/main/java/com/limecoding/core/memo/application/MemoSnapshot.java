package com.limecoding.core.memo.application;

import java.util.List;

public record MemoSnapshot(
        String prompt,
        List<Long> sourceIds,
        String templateStoredName,
        String templateOriginalName
) {
}
