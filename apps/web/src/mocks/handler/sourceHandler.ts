import { http, HttpResponse } from 'msw';

type Source = {
    id: string;
    name: string;
    type: 'docx' | 'xlsx' | 'pdf';
    checked: boolean;
}

type Memo = {
    id: string;
    title: string;
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

const sources: Source[] = [
    { id: '1', name: 'AI 기능 개발일정 1.docx', type: 'docx', checked: true },
    { id: '2', name: 'LLM 개발 비교.xlsx', type: 'xlsx', checked: true },
    { id: '3', name: '음성코칭 프로젝트 정의서.pdf', type: 'pdf', checked: true },
    { id: '4', name: '출시일정 정의서.pdf', type: 'pdf', checked: true },
]

const memos: Memo[] = [
    { id: '1', title: 'AI 기능 개발 일정 변경' },
    { id: '2', title: '다국어 음성 인식 정확도 개선 방안' },
    { id: '3', title: 'LLM 모델별 비용 효율성 비교 분석' },
    { id: '4', title: '사용자 피드백 기반 UI/UX 개선' },
    { id: '5', title: 'AI 기능 출시 마일스톤 정리' },
    { id: '6', title: '회의록: 음성 코칭 프로젝트 킥오프' },
    { id: '7', title: 'LLM 개발 우선순위 결정 회의' },
]

const inferType = (name: string): Source['type'] => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'docx' || ext === 'xlsx' || ext === 'pdf') {
        return ext;
    }
    return 'pdf';
}

export const sourceHandlers = [
    http.get('/api/v1/sources', () => {
        return HttpResponse.json(ok(sources));
    }),
    http.get('/api/memos', () => {
        return HttpResponse.json(memos);
    }),
    http.post('/api/v1/sources', async ({ request }) => {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        const newSources: Source[] = files.map((file) => ({
            id: crypto.randomUUID(),
            name: file.name,
            type: inferType(file.name),
            checked: true,
        }));

        sources.push(...newSources);
        return HttpResponse.json(ok(newSources));
    }),
]
