package com.limecoding.core.chat.application;

import com.limecoding.core.source.application.LoadedSource;
import com.limecoding.core.source.application.SourceService;
import com.limecoding.core.source.application.SourceTextExtractor;
import com.limecoding.core.source.domain.Source;
import com.limecoding.core.source.infrastructure.SourceJpaRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.tool.annotation.Tool;
import org.springframework.ai.tool.annotation.ToolParam;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
public class SourceQueryTools {

    private static final int MAX_CONTENT_LENGTH = 20_000;

    private final SourceJpaRepository sourceRepository;
    private final SourceService sourceService;
    private final SourceTextExtractor textExtractor;

    public record SourceSummary(Long id, String originalName, String embeddingStatus, Integer chunkCount) {}

    public record SourceContent(Long id, String originalName, String text, boolean truncated) {}

    @Tool(description = """
            등록된 모든 자료(소스 파일)의 목록을 반환한다.
            사용자가 "어떤 파일이 있어?", "등록된 자료가 뭐야?" 같이 자료 목록을 묻거나,
            특정 파일명에 해당하는 id를 찾아내야 할 때 호출한다.
            반환 필드: id, originalName, embeddingStatus(PENDING|IN_PROGRESS|COMPLETED|FAILED), chunkCount.
            getSourceContent 를 호출하려면 여기서 얻은 id 를 사용한다.
            """)
    public List<SourceSummary> listSources() {
        List<Source> sources = sourceRepository.findAll();
        log.info("[ToolCall] listSources -> {}건", sources.size());
        return sources.stream()
                .map(s -> new SourceSummary(
                        s.getId(),
                        s.getOriginalName(),
                        s.getEmbeddingStatus() == null ? null : s.getEmbeddingStatus().name(),
                        s.getEmbeddedChunkCount()))
                .toList();
    }

    @Tool(description = """
            특정 소스 파일의 추출된 전체 텍스트를 반환한다.
            사용자가 특정 파일의 내용을 직접 보여달라고 하거나,
            벡터 검색 결과만으로는 답하기 어려운 파일 단위 질문일 때 사용한다.
            sourceId 는 반드시 listSources 결과에서 얻은 값이어야 한다.
            본문이 매우 길면 앞부분만 잘려 반환되며 truncated=true 로 표시된다.
            """)
    public SourceContent getSourceContent(
            @ToolParam(description = "listSources 결과의 id 값") Long sourceId) {
        log.info("[ToolCall] getSourceContent(sourceId={})", sourceId);
        LoadedSource loaded = sourceService.loadSource(sourceId);
        String text = textExtractor.extract(loaded.content(), loaded.originalName());
        boolean truncated = text.length() > MAX_CONTENT_LENGTH;
        if (truncated) {
            text = text.substring(0, MAX_CONTENT_LENGTH);
        }
        return new SourceContent(sourceId, loaded.originalName(), text, truncated);
    }
}
