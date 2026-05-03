package com.limecoding.core.source.infrastructure;

import com.limecoding.core.source.domain.Source;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SourceJpaRepository extends JpaRepository<Source, Long> {
}
