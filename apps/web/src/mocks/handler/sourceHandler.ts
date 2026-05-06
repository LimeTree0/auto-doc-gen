import { http, HttpResponse } from 'msw';

type Source = {
    id: number;
    storedName: string;
    originalName: string;
}

type AddSourceResponse = {
    uploadedCount: number;
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

let nextId = 5;

export const sources: Source[] = [
    { id: 1, storedName: 'stored-1.docx', originalName: 'AI 기능 개발일정 1.docx' },
    { id: 2, storedName: 'stored-2.xlsx', originalName: 'LLM 개발 비교.xlsx' },
    { id: 3, storedName: 'stored-3.pdf', originalName: '음성코칭 프로젝트 정의서.pdf' },
    { id: 4, storedName: 'stored-4.pdf', originalName: '출시일정 정의서.pdf' },
]

export const sourceHandlers = [
    http.get('/api/v1/sources', () => {
        return HttpResponse.json(ok(sources));
    }),
    http.post('/api/v1/sources', async ({ request }) => {
        const formData = await request.formData();
        const files = formData.getAll('files') as File[];

        for (const file of files) {
            sources.push({
                id: nextId++,
                storedName: `stored-${crypto.randomUUID()}-${file.name}`,
                originalName: file.name,
            });
        }

        const response: AddSourceResponse = { uploadedCount: files.length };
        return HttpResponse.json(ok(response));
    }),
]
