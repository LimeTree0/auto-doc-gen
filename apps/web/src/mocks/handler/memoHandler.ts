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
    http.get('/api/v1/memos/:id/html', ({ params }) => {
        const id = Number(params.id);
        const memo = memos.find((m) => m.id === id);
        if (!memo) return error(404, 'Memo not found');
        if (memo.status === 'PENDING' || memo.status === 'IN_PROGRESS') {
            return error(409, '아직 생성 중입니다');
        }
        if (memo.status === 'FAILED') {
            return error(410, '생성에 실패하였습니다');
        }

        const firstLine = memo.prompt.split('\n')[0]?.trim() || `메모 ${memo.id}`;
        const sourceList = memo.sourceIds.map((sid) => `<li>소스 #${sid}</li>`).join('');
        const html = `<article>
  <h1>${firstLine}</h1>
  <p>본 보고서는 선택된 소스를 바탕으로 자동 생성된 초안입니다. 작성일자는 ${memo.createdAt.slice(0, 10)}이며, 작성된 프롬프트는 "${memo.prompt}" 입니다.</p>
  <h2>1. 개요</h2>
  <p>이 섹션에서는 핵심 주제를 요약하고, 분석에 활용된 자료의 범위와 한계를 간략하게 정리합니다. 본문에 등장하는 모든 인용은 아래 소스 목록을 참고하시기 바랍니다.</p>
  <h2>2. 주요 내용</h2>
  <p>다음과 같은 항목들이 핵심으로 도출되었습니다.</p>
  <ul>
    <li>주요 인사이트 1: 데이터에 기반한 우선 과제 식별</li>
    <li>주요 인사이트 2: 사용자 피드백과 정량 지표의 정합성 확인</li>
    <li>주요 인사이트 3: 다음 분기 액션 아이템 도출</li>
  </ul>
  <h2>3. 참고 소스</h2>
  <p>본 메모를 생성하는 데 활용된 소스의 식별자는 다음과 같습니다.</p>
  <ul>${sourceList}</ul>
  <h2>4. 제언</h2>
  <p>위 분석을 바탕으로, 후속 작업에서는 인용된 소스를 직접 검토하여 세부 사항을 보강하는 것을 권장합니다.</p>
</article>`;

        return HttpResponse.json(ok(html));
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
