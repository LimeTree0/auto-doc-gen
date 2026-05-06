package com.limecoding.core.source.infrastructure;

import com.limecoding.core.source.domain.Source;
import com.limecoding.core.source.domain.SourceEmbeddingStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SourceJpaRepository extends JpaRepository<Source, Long> {
    List<Source> findAllByEmbeddingStatus(SourceEmbeddingStatus status);
}
