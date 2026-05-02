import type { LucideIcon } from "lucide-react";
import { ArrowUp, AudioLines, BarChart3, Check, ChevronRight, FileSpreadsheet, FileText, HelpCircle, Layers, MoveRight, Network, PanelLeft, PanelRight, Paperclip, Plus, Presentation, RefreshCw, Search, Sparkles, StickyNote, Table, Video } from "lucide-react";
import Panel from "./Panel";

type SourceAddButtonProps = {
    onClick: () => void;
}

function SourceAddButton({ }: SourceAddButtonProps) {
    const textColor = 'text-[#ABABAB]';
    return (
        <button
            type="button"
            onClick={() => { }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2 hover:bg-white/5"
        >
            <Plus className={`size-4 ${textColor}`} strokeWidth={2} />
            <span className={`text-sm ${textColor}`}>소스 추가</span>
        </button>
    )
}

function SourceSearchBox() {
    return (
        <div className="border border-border rounded-lg p-3 bg-bg flex flex-col gap-3">
            <div className="flex flex-row gap-2 items-center">
                <Search className="size-4 text-white/60" strokeWidth={2} />
                <input
                    className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40"
                    placeholder="웹에서 새 소스를 검색하세요."
                />
            </div>
            <div className="flex items-center justify-between">
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => { }}
                        className="flex items-center gap-1.5 rounded-full border border-[#37383B] px-3 py-1 hover:bg-white/5"
                    >
                        <Network className="size-3.5 text-white" strokeWidth={2} />
                        <span className="text-xs text-white">웹</span>
                    </button>
                    <button
                        type="button"
                        onClick={() => { }}
                        className="flex items-center gap-1.5 rounded-full border border-[#37383B] px-3 py-1 hover:bg-white/5"
                    >
                        <Network className="size-3.5 text-white" strokeWidth={2} />
                        <span className="text-xs text-white">Fast Research</span>
                    </button>
                </div>
                <button
                    type="button"
                    onClick={() => { }}
                    className="flex size-7 items-center justify-center rounded-full border border-[#37383B] hover:bg-white/5"
                >
                    <MoveRight className="size-3.5 text-white" strokeWidth={2} />
                </button>
            </div>
        </div>
    )
}

type SourceFile = {
    name: string;
    type: 'docx' | 'xlsx' | 'pdf';
    checked: boolean;
}

const SOURCE_FILES: SourceFile[] = [
    { name: 'AI 기능 개발일정 1.docx', type: 'docx', checked: true },
    { name: 'LLM 개발 비교.xlsx', type: 'xlsx', checked: true },
    { name: '음성코칭 프로젝트 정의서.pdf', type: 'pdf', checked: true },
    { name: '출시일정 정의서.pdf', type: 'pdf', checked: true },
]

function FileTypeIcon({ type }: { type: SourceFile['type'] }) {
    if (type === 'xlsx') return <FileSpreadsheet className="size-4 text-emerald-400" strokeWidth={2} />
    if (type === 'pdf') return <FileText className="size-4 text-rose-400" strokeWidth={2} />
    return <FileText className="size-4 text-sky-400" strokeWidth={2} />
}

function SourceCheckbox({ checked }: { checked: boolean }) {
    return (
        <span
            className={`flex size-4 shrink-0 items-center justify-center rounded border ${checked
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-white/30'
                }`}
        >
            {checked && <Check className="size-3 text-white" strokeWidth={3} />}
        </span>
    )
}

function SelectAllRow({ checked }: { checked: boolean }) {
    return (
        <button
            type="button"
            onClick={() => { }}
            className="flex w-full items-center justify-end gap-2 rounded-md px-2 py-2 hover:bg-white/5"
        >
            <span className="text-sm text-white">모두 선택</span>
            <SourceCheckbox checked={checked} />
        </button>
    )
}

function SourceListItem({ file }: { file: SourceFile }) {
    return (
        <button
            type="button"
            onClick={() => { }}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5"
        >
            <FileTypeIcon type={file.type} />
            <span className="flex-1 truncate text-left text-sm text-white">{file.name}</span>
            <SourceCheckbox checked={file.checked} />
        </button>
    )
}

type LeftPanelProps = {
    className?: string;
}

function LeftPanel({ }: LeftPanelProps) {
    return (
        <Panel className="w-[25vw]" title="출처" buttonArea={<PanelRight className="size-4 text-white" strokeWidth={2} />}>
            <div className="flex flex-col gap-3 p-4">
                <SourceAddButton onClick={() => { }} />
                <SourceSearchBox />
                <div className="flex flex-col">
                    <SelectAllRow checked={SOURCE_FILES.every((f) => f.checked)} />
                    {SOURCE_FILES.map((file) => (
                        <SourceListItem key={file.name} file={file} />
                    ))}
                </div>
            </div>
        </Panel>
    )
}

function BotMessage() {
    return (
        <div className="flex gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
                <Sparkles className="size-4 text-emerald-400" strokeWidth={2} />
            </div>
            <div className="flex flex-1 flex-col gap-3 text-sm leading-relaxed text-white/90">
                <p>
                    외부 의견(Sounding) 신청 후 구조화하여 정리한 슬라이드와 함께
                    LLM의 응답을 다음과 같이 정리했습니다.
                </p>
                <h3 className="text-base font-bold text-white">
                    Slide 5. UI/UX 개선 및 향후 로드맵
                </h3>
                <ul className="flex list-disc flex-col gap-2 pl-5">
                    <li>
                        <span className="font-semibold text-white">모바일 최적화</span>
                        : 다양한 화면 크기에 대응하여 사용성 개선
                    </li>
                    <li>
                        <span className="font-semibold text-white">음성 인식 정확도 개선</span>
                        : 다국어 환경에서의 정확도 향상을 위한 모델(Llama, Gemma 등) 평가
                    </li>
                    <li>
                        <span className="font-semibold text-white">음성 기반 LLM 응답</span>
                        : 음성을 자연스럽게 처리하는 LLM 응답 시스템 도입
                    </li>
                    <li>
                        <span className="font-semibold text-white">사용자 피드백 반영</span>
                        : 베타 사용자의 의견을 빠르게 수집·반영하는 사이클 구축
                    </li>
                </ul>
            </div>
        </div>
    )
}

function UserMessage() {
    return (
        <div className="flex justify-end">
            <div className="max-w-[80%] rounded-2xl bg-[#2d3137] px-4 py-2.5">
                <p className="text-sm text-white">
                    이해를 돕기 위해 이번 슬라이드 내용을 좀 더 풀어서 다시 설명해주세요.
                </p>
            </div>
        </div>
    )
}

function ChatInput() {
    return (
        <div className="flex flex-col rounded-xl border border-[#37383B] bg-[#1A1D22]">
            <input
                className="border-none bg-transparent px-4 pt-3 pb-2 text-sm text-white outline-none placeholder:text-white/40"
                placeholder="무엇이든 물어보세요"
            />
            <div className="flex items-center justify-between px-3 pb-2">
                <button
                    type="button"
                    onClick={() => { }}
                    className="flex items-center gap-1.5 rounded-full px-2 py-1 text-xs text-white/60 hover:bg-white/5"
                >
                    <Paperclip className="size-3.5" strokeWidth={2} />
                    <span>출처 4개</span>
                </button>
                <button
                    type="button"
                    onClick={() => { }}
                    className="flex size-7 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600"
                >
                    <ArrowUp className="size-4 text-black" strokeWidth={2.5} />
                </button>
            </div>
        </div>
    )
}

type CenterPanelProps = {
    className?: string;
}

function CenterPanel({ }: CenterPanelProps) {
    return (
        <Panel
            className="flex-1"
            title="채팅"
            buttonArea={
                <button type="button" onClick={() => { }} className="text-white/70 hover:text-white">
                    <RefreshCw className="size-4" strokeWidth={2} />
                </button>
            }
        >
            <div className="flex h-full flex-col">
                <div className="flex flex-1 flex-col gap-6 overflow-y-auto p-4">
                    <BotMessage />
                    <UserMessage />
                </div>
                <div className="flex flex-col gap-2 p-4">
                    <ChatInput />
                </div>
            </div>
        </Panel>
    )
}

type ArtifactColor = 'blue' | 'yellow' | 'green' | 'pink' | 'orange' | 'cyan';

const ARTIFACT_COLOR_MAP: Record<ArtifactColor, string> = {
    blue: 'bg-sky-400/15 text-sky-300',
    yellow: 'bg-amber-400/15 text-amber-300',
    green: 'bg-emerald-400/15 text-emerald-300',
    pink: 'bg-pink-400/15 text-pink-300',
    orange: 'bg-orange-400/15 text-orange-300',
    cyan: 'bg-cyan-400/15 text-cyan-300',
}

type Artifact = {
    icon: LucideIcon;
    label: string;
    color: ArtifactColor;
    beta?: boolean;
    chevron?: boolean;
}

const ARTIFACTS: Artifact[] = [
    { icon: AudioLines, label: 'AI 오디오 오버뷰', color: 'blue', chevron: true },
    { icon: Presentation, label: '슬라이드 자료', color: 'yellow', beta: true, chevron: true },
    { icon: Video, label: '동영상 개요', color: 'green', chevron: true },
    { icon: Network, label: '마인드맵', color: 'pink' },
    { icon: FileText, label: '보고서', color: 'yellow', chevron: true },
    { icon: Layers, label: '플래시카드', color: 'orange', chevron: true },
    { icon: HelpCircle, label: '퀴즈', color: 'cyan', chevron: true },
    { icon: BarChart3, label: '인포그래픽', color: 'pink', beta: true, chevron: true },
    { icon: Table, label: '데이터 표', color: 'blue', chevron: true },
]

function ArtifactCard({ icon: Icon, label, color, beta, chevron }: Artifact) {
    return (
        <button
            type="button"
            onClick={() => { }}
            className={`flex flex-col gap-2 rounded-xl border border-border p-2.5 text-left hover:bg-white/5 ${ARTIFACT_COLOR_MAP[color]}`}
        >
            <div className="flex w-full items-start justify-between">
                <div className={`flex size-4 shrink-0 items-center justify-center rounded-lg ${ARTIFACT_COLOR_MAP[color]}`}>
                    <Icon className="size-4" strokeWidth={2} />
                </div>
                {chevron && (
                    <ChevronRight className="size-4 shrink-0 text-white/40" strokeWidth={2} />
                )}
            </div>
            <div className="flex min-w-0 items-center gap-1.5">
                <span className="truncate text-xs text-white">{label}</span>
                {beta && (
                    <span className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-white/60">
                        베타
                    </span>
                )}
            </div>
        </button>
    )
}

const MEMOS: string[] = [
    'AI 기능 개발 일정 변경',
    '다국어 음성 인식 정확도 개선 방안',
    'LLM 모델별 비용 효율성 비교 분석',
    '사용자 피드백 기반 UI/UX 개선',
    'AI 기능 출시 마일스톤 정리',
    '회의록: 음성 코칭 프로젝트 킥오프',
    'LLM 개발 우선순위 결정 회의',
]

function MemoItem({ title }: { title: string }) {
    return (
        <button
            type="button"
            onClick={() => { }}
            className="flex w-full items-center gap-2 rounded-lg border border-[#37383B] bg-[#1A1D22] px-3 py-2.5 text-left hover:bg-white/5"
        >
            <StickyNote className="size-4 shrink-0 text-amber-300" strokeWidth={2} />
            <span className="flex-1 truncate text-sm text-white">{title}</span>
        </button>
    )
}

type RightPanelProps = {
    className?: string;
}

function RightPanel({ }: RightPanelProps) {
    return (
        <Panel
            className="w-[25vw]"
            title="스튜디오"
            buttonArea={<PanelLeft className="size-4 text-white" strokeWidth={2} />}
        >
            <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-2">
                    {ARTIFACTS.map((artifact) => (
                        <ArtifactCard key={artifact.label} {...artifact} />
                    ))}
                </div>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-medium text-white">메모</span>
                        <button
                            type="button"
                            onClick={() => { }}
                            className="flex size-6 items-center justify-center rounded-full hover:bg-white/5"
                        >
                            <Plus className="size-4 text-white" strokeWidth={2} />
                        </button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {MEMOS.map((title) => (
                            <MemoItem key={title} title={title} />
                        ))}
                    </div>
                </div>
            </div>
        </Panel>
    )
}

export { CenterPanel, LeftPanel, RightPanel };

