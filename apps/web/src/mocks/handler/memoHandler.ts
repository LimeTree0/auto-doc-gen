import { http, HttpResponse } from 'msw';

type MemoStatus = 'pending' | 'completed' | 'failed';

type Memo = {
    id: string;
    title: string;
    status: MemoStatus;
}

type ApiResponse<T> = {
    status: string;
    data: T;
    error: string | null;
}

const ok = <T>(data: T): ApiResponse<T> => ({
    status: '200 OK',
    data,
    error: null,
});

const memos: Memo[] = [
    { id: '1', title: 'AI 기능 개발 일정 변경', status: 'completed' },
    { id: '2', title: '다국어 음성 인식 정확도 개선 방안', status: 'completed' },
    { id: '3', title: 'LLM 모델별 비용 효율성 비교 분석', status: 'completed' },
    { id: '4', title: '사용자 피드백 기반 UI/UX 개선', status: 'pending' },
    { id: '5', title: 'AI 기능 출시 마일스톤 정리', status: 'completed' },
    { id: '6', title: '회의록: 음성 코칭 프로젝트 킥오프', status: 'failed' },
    { id: '7', title: 'LLM 개발 우선순위 결정 회의', status: 'completed' },
]

export const memoHandlers = [
    http.get('/api/v1/memos', () => {
        return HttpResponse.json(ok(memos));
    }),
]
