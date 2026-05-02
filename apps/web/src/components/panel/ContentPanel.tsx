import { Check, FileSpreadsheet, FileText, MoveRight, Network, PanelRight, Plus, Search } from "lucide-react";
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

type CenterPanelProps = {
    className?: string;
}

function CenterPanel({ }: CenterPanelProps) {
    return (
        <Panel className="flex-1" title="출처" buttonArea={<img src="/icons/arrow-right.svg" alt="arrow-right" className="w-4 h-4" />}>
            <div>센터</div>
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

