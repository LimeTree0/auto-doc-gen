import { http, HttpResponse } from 'msw';

type MemoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

type Memo = {
    id: number;
    status: MemoStatus;
    sourceIds: number[];
    prompt: string;
    createdAt: string;
}

type ApiResponse<T> = {
    status: string;
    data: T;
    error: string | null;
}

const ok = <T>(data: T): ApiResponse<T> => ({
    status: 'OK',
    data,
    error: null,
});

const error = (status: number, message: string) =>
    HttpResponse.json({ status: 'ERROR', data: null, error: message }, { status });

let nextId = 8;

const memos: Memo[] = [
    { id: 1, status: 'COMPLETED', sourceIds: [1, 2], prompt: 'AI 기능 개발 일정 변경', createdAt: '2026-04-01T09:00:00' },
    { id: 2, status: 'COMPLETED', sourceIds: [1, 3], prompt: '다국어 음성 인식 정확도 개선 방안', createdAt: '2026-04-02T09:00:00' },
    { id: 3, status: 'COMPLETED', sourceIds: [2], prompt: 'LLM 모델별 비용 효율성 비교 분석', createdAt: '2026-04-03T09:00:00' },
    { id: 4, status: 'IN_PROGRESS', sourceIds: [1, 2, 3], prompt: '사용자 피드백 기반 UI/UX 개선', createdAt: '2026-04-04T09:00:00' },
    { id: 5, status: 'COMPLETED', sourceIds: [4], prompt: 'AI 기능 출시 마일스톤 정리', createdAt: '2026-04-05T09:00:00' },
    { id: 6, status: 'FAILED', sourceIds: [3], prompt: '회의록: 음성 코칭 프로젝트 킥오프', createdAt: '2026-04-06T09:00:00' },
    { id: 7, status: 'COMPLETED', sourceIds: [1, 4], prompt: 'LLM 개발 우선순위 결정 회의', createdAt: '2026-04-07T09:00:00' },
]

const transitionStatus = (id: number, status: MemoStatus) => {
    const memo = memos.find((m) => m.id === id);
    if (memo) memo.status = status;
}

export const memoHandlers = [
    // NOTE: 백엔드 list 엔드포인트가 없어 MSW에만 mock 존재. BE에 GET /api/v1/memos 추가 필요.
    http.get('/api/v1/memos', () => {
        return HttpResponse.json(ok(memos));
    }),
    http.get('/api/v1/memos/:id', ({ params }) => {
        const id = Number(params.id);
        const memo = memos.find((m) => m.id === id);
        if (!memo) return error(404, 'Memo not found');
        return HttpResponse.json(ok(memo));
    }),
    http.post('/api/v1/memos', async ({ request }) => {
        const formData = await request.formData();
        const sourceIds = formData.getAll('sourceIds').map((v) => Number(v));
        const template = formData.get('template');
        const prompt = String(formData.get('prompt') ?? '');

        if (sourceIds.length === 0) return error(400, '소스 ID는 최소 1개 이상이어야 합니다');
        if (!(template instanceof File)) return error(400, '템플릿 파일이 필요합니다');
        if (!prompt) return error(400, 'prompt가 비어있습니다');

        const memo: Memo = {
            id: nextId++,
            status: 'PENDING',
            sourceIds,
            prompt,
            createdAt: new Date().toISOString(),
        };
        memos.unshift(memo);

        // 데모: 비동기 진행 시뮬레이션
        setTimeout(() => transitionStatus(memo.id, 'IN_PROGRESS'), 1500);
        setTimeout(() => transitionStatus(memo.id, 'COMPLETED'), 5000);

        return HttpResponse.json(ok(memo));
    }),
]
