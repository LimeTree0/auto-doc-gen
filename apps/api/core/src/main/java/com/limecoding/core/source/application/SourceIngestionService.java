package com.limecoding.core.source.application;

import com.limecoding.core.memo.application.SourceFormat;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.ai.document.Document;
import org.springframework.ai.transformer.splitter.TokenTextSplitter;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class SourceIngestionService {

    public static final String META_SOURCE_ID = "sourceId";
    public static final String META_ORIGINAL_NAME = "originalName";
    public static final String META_FORMAT = "format";
    public static final String META_CHUNK_INDEX = "chunkIndex";

    private final VectorStore vectorStore;
    private final SourceTextExtractor textExtractor;
    private final TokenTextSplitter splitter = TokenTextSplitter.builder().build();

    public int ingest(Long sourceId, String originalName, byte[] content) {
        String text = textExtractor.extract(content, originalName);
        if (text == null || text.isBlank()) {
            log.warn("[Source:{}] 추출된 텍스트가 비어 있어 임베딩을 건너뜀", sourceId);
            return 0;
        }

        SourceFormat format = SourceFormat.fromFilename(originalName);
        Map<String, Object> baseMetadata = new HashMap<>();
        baseMetadata.put(META_SOURCE_ID, sourceId);
        baseMetadata.put(META_ORIGINAL_NAME, originalName);
        baseMetadata.put(META_FORMAT, format.name());

        List<Document> chunks = splitter.apply(List.of(new Document(text, baseMetadata)));
        List<Document> indexed = new ArrayList<>(chunks.size());
        for (int i = 0; i < chunks.size(); i++) {
            Document chunk = chunks.get(i);
            Map<String, Object> meta = new HashMap<>(chunk.getMetadata());
            meta.put(META_CHUNK_INDEX, i);
            indexed.add(new Document(chunk.getText(), meta));
        }

        log.info("[Source:{}] 청크 {}개를 vectorStore에 적재", sourceId, indexed.size());
        vectorStore.add(indexed);
        return indexed.size();
    }
}
