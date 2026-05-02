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

export const handlers = [
    http.get('/api/sources', () => {
        return HttpResponse.json(sources);
    }),
    http.get('/api/memos', () => {
        return HttpResponse.json(memos);
    }),
]
