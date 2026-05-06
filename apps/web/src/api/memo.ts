import { useQuery } from '@tanstack/react-query';

export type MemoStatus = 'pending' | 'completed' | 'failed';

export type Memo = {
    id: string;
    title: string;
    status: MemoStatus;
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
    });
}
