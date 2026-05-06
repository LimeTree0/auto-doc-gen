package com.limecoding.core.memo.presentation;

import com.limecoding.core.common.ApiResponse;
import com.limecoding.core.memo.application.MemoService;
import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.memo.presentation.dto.GetMemoResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/v1/memos")
@RequiredArgsConstructor
public class MemoController {
    private static final MediaType DOCX_MEDIA_TYPE =
            MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document");

    private final MemoService memoService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<GetMemoResponse> create(
            @RequestParam("sourceIds") List<Long> sourceIds,
            @RequestPart("template") MultipartFile template,
            @RequestParam("prompt") String prompt
    ) {
        Memo memo = memoService.requestGeneration(sourceIds, template, prompt);
        return ApiResponse.success(GetMemoResponse.from(memo));
    }

    @GetMapping("/{id}")
    public ApiResponse<GetMemoResponse> get(@PathVariable Long id) {
        return ApiResponse.success(GetMemoResponse.from(memoService.getMemo(id)));
    }

    @GetMapping("/{id}/docx")
    public ResponseEntity<byte[]> download(@PathVariable Long id) {
        byte[] data = memoService.readResult(id);
        return ResponseEntity.ok()
                .contentType(DOCX_MEDIA_TYPE)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=memo-" + id + ".docx")
                .body(data);
    }
}
