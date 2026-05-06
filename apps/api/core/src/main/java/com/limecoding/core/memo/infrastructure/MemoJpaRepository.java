package com.limecoding.core.memo.infrastructure;

import com.limecoding.core.memo.domain.Memo;
import com.limecoding.core.memo.domain.MemoStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface MemoJpaRepository extends JpaRepository<Memo, Long> {
    List<Memo> findAllByStatus(MemoStatus status);
}
