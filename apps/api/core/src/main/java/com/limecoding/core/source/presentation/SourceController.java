package com.limecoding.core.source.presentation;

import com.limecoding.core.common.ApiResponse;
import com.limecoding.core.source.application.SourceService;
import com.limecoding.core.source.domain.Source;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RequiredArgsConstructor
@RequestMapping("/api/v1/sources")
@RestController
public class SourceController {
    private final SourceService sourceService;

    @GetMapping
    public ApiResponse<List<Source>> getSources() {
        List<Source> sources = sourceService.getSources();

        return ApiResponse.success(sources);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> addSource(@RequestPart("files") List<MultipartFile> multipartFileList) {

        sourceService.uploadSources(multipartFileList);
        return ApiResponse.success("Source added successfully");
    }
}
