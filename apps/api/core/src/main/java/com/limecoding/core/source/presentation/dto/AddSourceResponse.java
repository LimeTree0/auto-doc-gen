package com.limecoding.core.source.presentation.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class AddSourceResponse {
    private int uploadedCount;

    public static AddSourceResponse of(int uploadedCount) {
        return new AddSourceResponse(uploadedCount);
    }
}
