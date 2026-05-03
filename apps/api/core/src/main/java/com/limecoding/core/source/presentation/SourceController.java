package com.limecoding.core.source.presentation;

import com.limecoding.core.common.ApiResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@Slf4j
@RequestMapping("/api/v1/sources")
@RestController
public class SourceController {

    @GetMapping
    public String getSources() {
        return "List of sources";
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<String> addSource(@RequestPart("files") List<MultipartFile> multipartFileList) {
        log.info("Received files: {}", multipartFileList);

        return ApiResponse.success("Source added successfully");
    }
}
