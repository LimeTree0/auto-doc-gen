package com.limecoding.core.memo.application;

import org.springframework.stereotype.Component;

import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * 비동기 메모 워커가 발행하는 단계(progress) 메시지를 채팅 도구가 폴링으로 읽어가기 위한 공유 버스.
 * memoId 기준으로 최신 step 만 보관한다 — 채팅 도구는 폴링 시 직전과 다르면 SSE 로 흘려보낸다.
 */
@Component
public class MemoProgressBus {

    private final ConcurrentMap<Long, String> latest = new ConcurrentHashMap<>();

    public void publish(Long memoId, String step) {
        latest.put(memoId, step);
    }

    public Optional<String> peek(Long memoId) {
        return Optional.ofNullable(latest.get(memoId));
    }

    public void clear(Long memoId) {
        latest.remove(memoId);
    }
}
