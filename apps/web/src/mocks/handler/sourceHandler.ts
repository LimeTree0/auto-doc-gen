import { http, HttpResponse } from 'msw';

type Source = {
    id: string;
    name: string;
    type: 'docx' | 'xlsx' | 'pdf';
    checked: boolean;
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
