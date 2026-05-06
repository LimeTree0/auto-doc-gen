package com.limecoding.core.source.presentation;

import com.limecoding.core.common.ApiResponse;
import com.limecoding.core.source.application.SourceService;
import com.limecoding.core.source.presentation.dto.AddSourceFromMemoRequest;
import com.limecoding.core.source.presentation.dto.AddSourceResponse;
import com.limecoding.core.source.presentation.dto.GetSourceResponse;
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
    public ApiResponse<List<GetSourceResponse>> getSources() {
        List<GetSourceResponse> sources = sourceService.getSources().stream()
                .map(GetSourceResponse::from)
                .toList();

        return ApiResponse.success(sources);
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<AddSourceResponse> addSource(@RequestPart("files") List<MultipartFile> multipartFileList) {
        sourceService.uploadSources(multipartFileList);

        return ApiResponse.success(AddSourceResponse.of(multipartFileList.size()));
    }

    @PostMapping("/from-memo")
    public ApiResponse<AddSourceResponse> addFromMemo(@RequestBody AddSourceFromMemoRequest request) {
        sourceService.uploadFromMemo(request.memoId());

        return ApiResponse.success(AddSourceResponse.of(1));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> deleteSource(@PathVariable Long id) {
        sourceService.deleteSource(id);
        return ApiResponse.success(null);
    }
}
