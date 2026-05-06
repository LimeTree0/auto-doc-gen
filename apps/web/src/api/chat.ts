import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export type Conversation = {
    id: number;
    title: string;
    createdAt: string;
    updatedAt: string;
}

export type Message = {
    id: number;
    conversationId: number;
    role: MessageRole;
    content: string;
    createdAt: string;
}

export type ChatStreamChunk =
    | { type: 'delta'; content: string }
    | { type: 'done'; messageId: number }
    | { type: 'error'; error: string };

export type ApiResponse<T> = {
    status: string;
    data: T;
    error: string | null;
}

const CHAT_URL = '/api/v1/chat/conversations';

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

export const createConversation = async (title?: string): Promise<Conversation> => {
    const response = await fetch(CHAT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title ?? null }),
    });
    return unwrap<Conversation>(response, 'Failed to create conversation');
};

export const getMessages = async (conversationId: number): Promise<Message[]> => {
    const response = await fetch(`${CHAT_URL}/${conversationId}/messages`);
    return unwrap<Message[]>(response, 'Failed to fetch messages');
};

export const chatKeys = {
    messages: (conversationId: number | null) => ['chat', 'messages', conversationId] as const,
};

export const useCreateConversationMutation = () => {
    return useMutation({
        mutationFn: (title?: string) => createConversation(title),
    });
};

export const useMessagesQuery = (conversationId: number | null) => {
    return useQuery({
        queryKey: chatKeys.messages(conversationId),
        queryFn: () => getMessages(conversationId as number),
        enabled: conversationId != null,
    });
};

export type StreamCallbacks = {
    onDelta: (chunk: string) => void;
    onDone: (messageId: number) => void;
    onError: (message: string) => void;
};

export const streamMessage = async (
    conversationId: number,
    content: string,
    callbacks: StreamCallbacks,
    signal: AbortSignal,
): Promise<void> => {
    const response = await fetch(`${CHAT_URL}/${conversationId}/messages`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
        },
        body: JSON.stringify({ content }),
        signal,
    });

    if (!response.ok || !response.body) {
        throw new Error(`스트리밍 시작 실패 (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    try {
        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            // SSE는 \n\n 으로 이벤트 경계를 구분.
            let boundary = buffer.indexOf('\n\n');
            while (boundary !== -1) {
                const rawEvent = buffer.slice(0, boundary);
                buffer = buffer.slice(boundary + 2);
                handleEvent(rawEvent, callbacks);
                boundary = buffer.indexOf('\n\n');
            }
        }
        if (buffer.trim().length > 0) {
            handleEvent(buffer, callbacks);
        }
    } finally {
        reader.releaseLock();
    }
};

const handleEvent = (raw: string, callbacks: StreamCallbacks): void => {
    let eventName: string | null = null;
    const dataLines: string[] = [];
    for (const line of raw.split('\n')) {
        if (line.startsWith('event:')) {
            eventName = line.slice(6).trim();
        } else if (line.startsWith('data:')) {
            dataLines.push(line.slice(5).trimStart());
        }
    }
    if (dataLines.length === 0) return;

    const dataStr = dataLines.join('\n');
    let parsed: ChatStreamChunk;
    try {
        parsed = JSON.parse(dataStr) as ChatStreamChunk;
    } catch {
        return;
    }

    const type = parsed.type ?? eventName;
    if (type === 'delta' && 'content' in parsed) {
        callbacks.onDelta(parsed.content);
    } else if (type === 'done' && 'messageId' in parsed) {
        callbacks.onDone(parsed.messageId);
    } else if (type === 'error' && 'error' in parsed) {
        callbacks.onError(parsed.error);
    }
};

export const useInvalidateMessages = () => {
    const queryClient = useQueryClient();
    return (conversationId: number) =>
        queryClient.invalidateQueries({ queryKey: chatKeys.messages(conversationId) });
};
