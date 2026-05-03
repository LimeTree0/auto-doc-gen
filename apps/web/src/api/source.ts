import { useQuery } from '@tanstack/react-query';

export type Source = {
    id: string;
    name: string;
    type: 'docx' | 'xlsx' | 'pdf';
    checked: boolean;
}

export const getSources = async (): Promise<Source[]> => {
    const response = await fetch('/api/sources');

    if (!response.ok) {
        throw new Error('Failed to fetch sources');
    }

    const data = await response.json();

    return data;
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