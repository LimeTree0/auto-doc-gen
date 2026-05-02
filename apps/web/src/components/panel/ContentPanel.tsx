import { ArrowUp, Check, FileSpreadsheet, FileText, MoveRight, Network, PanelRight, Paperclip, Plus, RefreshCw, Search, Sparkles } from "lucide-react";
import Panel from "./Panel";

type SourceAddButtonProps = {
    onClick: () => void;
}

function SourceAddButton({ }: SourceAddButtonProps) {
    return (
        <button
            type="button"
            onClick={() => { }}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[#37383B] px-4 py-2 hover:bg-white/5"
        >
            <Plus className="size-4 text-white" strokeWidth={2} />
            <span className="text-sm text-white">소스 추가</span>
        </button>
    )
}

function SourceSearchBox() {
    return (
        <div className="border border-[#37383B] rounded-lg p-3 bg-[#1A1D22] flex flex-col gap-3">
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
            className="flex w-full items-center justify-between rounded-md px-2 py-2 hover:bg-white/5"
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
                    <p className="text-center text-xs text-white/40">
                        Roundtable AI는 부정확한 정보를 제공할 수 있으므로 중요한 정보는 재차 확인하세요.
                    </p>
                </div>
            </div>
        </Panel>
    )
}

type RightPanelProps = {
    className?: string;
}

function RightPanel({ }: RightPanelProps) {
    return (
        <Panel className="w-[25vw]" title="출처" buttonArea={<img src="/icons/arrow-right.svg" alt="arrow-right" className="w-4 h-4" />}>

        </Panel>
    )
}

export { CenterPanel, LeftPanel, RightPanel };

