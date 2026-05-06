package com.limecoding.core.source.presentation.dto;

import com.limecoding.core.source.domain.Source;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class GetSourceResponse {
    private Long id;
    private String name;
    private String originalName;

    public static GetSourceResponse from(Source source) {
        return new GetSourceResponse(source.getId(), source.getName(), source.getOriginalName());
    }
}
