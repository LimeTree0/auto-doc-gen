import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type MemoStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';

export type Memo = {
    id: number;
    status: MemoStatus;
    sourceIds: number[];
    prompt: string;
    createdAt: string;
}

export type ApiResponse<T> = {
    status: string;
    data: T;
    error: string | null;
}

const MEMOS_URL = '/api/v1/memos';

const unwrap = async <T>(response: Response, errorMessage: string): Promise<T> => {
    if (!response.ok) {
        throw new Error(errorMessage);
    }

    const body = (await response.json()) as ApiResponse<T>;

    if (body.error) {
        throw new Error(body.error);
    }

    return body.data;
};

export const getMemos = async (): Promise<Memo[]> => {
    const response = await fetch(MEMOS_URL);
    return unwrap<Memo[]>(response, 'Failed to fetch memos');
};

export const memoKeys = {
    all: ['memos'] as const,
}

export const useMemosQuery = () => {
    return useQuery({
        queryKey: memoKeys.all,
        queryFn: getMemos,
        refetchInterval: (query) => {
            const memos = query.state.data;
            if (!memos) return false;
            const hasInFlight = memos.some((m) => m.status === 'PENDING' || m.status === 'IN_PROGRESS');
            return hasInFlight ? 2000 : false;
        },
    });
}

export type CreateMemoParams = {
    sourceIds: number[];
    template: File;
    prompt: string;
}

export const createMemo = async ({ sourceIds, template, prompt }: CreateMemoParams): Promise<Memo> => {
    const formData = new FormData();
    for (const id of sourceIds) {
        formData.append('sourceIds', String(id));
    }
    formData.append('template', template);
    formData.append('prompt', prompt);

    const response = await fetch(MEMOS_URL, {
        method: 'POST',
        body: formData,
    });

    return unwrap<Memo>(response, 'Failed to create memo');
}

export const useCreateMemoMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: createMemo,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: memoKeys.all });
        },
    });
}

export const getMemoHtml = async (id: number): Promise<string> => {
    const response = await fetch(`${MEMOS_URL}/${id}/html`, {
        headers: { Accept: 'text/html' },
    });
    if (!response.ok) {
        const message = (await response.text()) || `Failed to fetch memo html (${response.status})`;
        throw new Error(message);
    }
    return response.text();
}

export const useMemoHtmlQuery = (id: number | null) => {
    return useQuery({
        queryKey: ['memos', id, 'html'] as const,
        queryFn: () => getMemoHtml(id as number),
        enabled: id != null,
    });
}

export const downloadMemoDocx = async (id: number, filename?: string): Promise<void> => {
    const response = await fetch(`${MEMOS_URL}/${id}/docx`);
    if (!response.ok) {
        throw new Error(`Failed to download docx (${response.status})`);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename ?? `memo-${id}.docx`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
}
