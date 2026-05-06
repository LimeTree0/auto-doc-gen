import { useMutation, useMutationState, useQueryClient, useQuery } from '@tanstack/react-query';

export type SourceType = 'docx' | 'xlsx' | 'pdf';

export type Source = {
    id: number;
    storedName: string;
    originalName: string;
}

export type AddSourceResponse = {
    uploadedCount: number;
}

export type ApiResponse<T> = {
    status: string;
    data: T;
    error: string | null;
}

const SOURCES_URL = '/api/v1/sources';

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

export const inferSourceType = (name: string): SourceType => {
    const ext = name.split('.').pop()?.toLowerCase();
    if (ext === 'docx' || ext === 'xlsx' || ext === 'pdf') return ext;
    return 'pdf';
}

export const getSources = async (): Promise<Source[]> => {
    const response = await fetch(SOURCES_URL);
    return unwrap<Source[]>(response, 'Failed to fetch sources');
};

export const sourceKeys = {
    all: ['sources'] as const,
}

export const useSourcesQuery = () => {
    return useQuery({
        queryKey: sourceKeys.all,
        queryFn: getSources,
    });
}

export const uploadSources = async (files: File[]): Promise<AddSourceResponse> => {
    const formData = new FormData();

    for (const file of files) {
        formData.append('files', file);
    }

    const response = await fetch(SOURCES_URL, {
        method: 'POST',
        body: formData,
    });

    return unwrap<AddSourceResponse>(response, 'Failed to upload sources');
}

export const useUploadSourcesMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: uploadSources,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: sourceKeys.all });
        },
    });
}

export type AddSourceFromMemoVariables = { memoId: number };

export const addSourceFromMemo = async ({ memoId }: AddSourceFromMemoVariables): Promise<AddSourceResponse> => {
    const response = await fetch(`${SOURCES_URL}/from-memo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ memoId }),
    });
    return unwrap<AddSourceResponse>(response, 'Failed to add source from memo');
}

export const sourceFromMemoMutationKey = ['source', 'fromMemo'] as const;

export const useAddSourceFromMemoMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationKey: sourceFromMemoMutationKey,
        mutationFn: addSourceFromMemo,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: sourceKeys.all });
        },
    });
}

export const usePendingMemoConversionIds = (): number[] => {
    const variables = useMutationState({
        filters: { mutationKey: sourceFromMemoMutationKey, status: 'pending' },
        select: (m) => (m.state.variables as AddSourceFromMemoVariables | undefined)?.memoId,
    });
    return variables.filter((id): id is number => typeof id === 'number');
}

export const deleteSource = async (id: number): Promise<void> => {
    const response = await fetch(`${SOURCES_URL}/${id}`, { method: 'DELETE' });
    await unwrap<unknown>(response, 'Failed to delete source');
}

export const useDeleteSourceMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: deleteSource,
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: sourceKeys.all });
        },
    });
}
