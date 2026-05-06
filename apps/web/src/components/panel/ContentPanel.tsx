import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft, ArrowRight, ArrowUp, AudioLines, BarChart3, Check, ChevronDown, ChevronRight, FileSpreadsheet, FileText, Files, Globe, HelpCircle, Layers, Loader2, MoveRight, Network, PanelLeft, PanelRight, Paperclip, Pencil, Plus, Presentation, RefreshCw, Search, Sparkles, StickyNote, Table, Video, Wand2, X } from "lucide-react";
import { createContext, useContext, useMemo, useRef, useState, type ComponentProps, type ReactNode } from "react";
import { useCreateMemoMutation, useMemosQuery, type Memo } from "@/api/memo";
import { inferSourceType, useSourcesQuery, type SourceType } from "@/api/source";
import FileUpload from "./FileUpload";
import Panel from "./Panel";

function SourceAddButton() {
    const textColor = 'text-[#ABABAB]';
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <button
                    type="button"
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-border px-4 py-2 hover:bg-white/5"
                >
                    <Plus className={`size-4 ${textColor}`} strokeWidth={2} />
                    <span className={`text-sm ${textColor}`}>소스 추가</span>
                </button>
            </DialogTrigger>
            <SourceAddDialog onUploadStart={() => setOpen(false)} />
        </Dialog>
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
    id: number;
    name: string;
    type: SourceType;
    checked: boolean;
}

type SourceContextValue = {
    files: SourceFile[];
    selectedCount: number;
    selectedIds: number[];
    allChecked: boolean;
    toggleAll: () => void;
    toggleOne: (id: number) => void;
}

const SourceContext = createContext<SourceContextValue | null>(null);

function SourceProvider({ children }: { children: ReactNode }) {
    const { data: sources } = useSourcesQuery();
    const [uncheckedIds, setUncheckedIds] = useState<Set<number>>(new Set());

    const files = useMemo<SourceFile[]>(() => {
        if (!sources) return [];
        return sources.map((s) => ({
            id: s.id,
            name: s.originalName,
            type: inferSourceType(s.originalName),
            checked: !uncheckedIds.has(s.id),
        }));
    }, [sources, uncheckedIds]);

    const selectedCount = files.filter((f) => f.checked).length;
    const selectedIds = files.filter((f) => f.checked).map((f) => f.id);
    const allChecked = files.length > 0 && files.every((f) => f.checked);

    const toggleAll = () => {
        if (allChecked) {
            setUncheckedIds(new Set(files.map((f) => f.id)));
        } else {
            setUncheckedIds(new Set());
        }
    };

    const toggleOne = (id: number) => {
        setUncheckedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    return (
        <SourceContext.Provider value={{ files, selectedCount, selectedIds, allChecked, toggleAll, toggleOne }}>
            {children}
        </SourceContext.Provider>
    )
}

function useSources() {
    const ctx = useContext(SourceContext);
    if (!ctx) throw new Error('useSources must be used within SourceProvider');
    return ctx;
}

function FileTypeIcon({ type }: { type: SourceType }) {
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

function SelectAllRow({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center justify-end gap-2 rounded-md px-2 py-2 hover:bg-white/5"
        >
            <span className="text-sm text-white">모두 선택</span>
            <SourceCheckbox checked={checked} />
        </button>
    )
}

function SourceListItem({ file, onToggle }: { file: SourceFile; onToggle: () => void }) {
    return (
        <button
            type="button"
            onClick={onToggle}
            className="flex w-full items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5"
        >
            <FileTypeIcon type={file.type} />
            <span className="flex-1 truncate text-left text-sm text-white">{file.name}</span>
            <SourceCheckbox checked={file.checked} />
        </button>
    )
}

type SourceAddDialogProps = {
    onUploadStart?: () => void;
}

function SourceAddDialog({ onUploadStart }: SourceAddDialogProps = {}) {
    const used = 3;
    const total = 50;
    const percent = Math.min(100, Math.round((used / total) * 100));

    return (
        <DialogContent
            className="bg-bg text-white border border-[#37383B] ring-0 sm:max-w-2xl p-6 gap-5"
        >
            <DialogHeader className="items-center pt-2">
                <DialogTitle className="text-center text-lg font-medium text-white">
                    <span className="text-sky-300">웹사이트</span>를 활용해 AI 오디오 및 동영상 오버뷰 만들기
                </DialogTitle>
                <DialogDescription className="sr-only">
                    웹에서 새 소스를 검색하거나 파일을 업로드하세요.
                </DialogDescription>
            </DialogHeader>

            <div className="rounded-xl border-2 border-sky-500/70 bg-[#22262b] p-3 ring-2 ring-sky-500/20 flex flex-col gap-3">
                <div className="flex items-center gap-2">
                    <Search className="size-4 text-white/60" strokeWidth={2} />
                    <input
                        className="w-full bg-transparent border-none outline-none text-sm text-white placeholder:text-white/40"
                        placeholder="웹에서 새 소스를 검색하세요"
                    />
                </div>
                <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => { }}
                            className="flex items-center gap-1 rounded-full border border-[#37383B] bg-bg px-3 py-1 hover:bg-white/5"
                        >
                            <Globe className="size-3.5 text-white" strokeWidth={2} />
                            <span className="text-xs text-white">웹</span>
                            <ChevronDown className="size-3 text-white/60" strokeWidth={2} />
                        </button>
                        <button
                            type="button"
                            onClick={() => { }}
                            className="flex items-center gap-1 rounded-full border border-[#37383B] bg-bg px-3 py-1 hover:bg-white/5"
                        >
                            <Sparkles className="size-3.5 text-white" strokeWidth={2} />
                            <span className="text-xs text-white">Fast Research</span>
                            <ChevronDown className="size-3 text-white/60" strokeWidth={2} />
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={() => { }}
                        className="flex size-7 items-center justify-center rounded-full border border-[#37383B] hover:bg-white/5"
                    >
                        <ArrowRight className="size-3.5 text-white" strokeWidth={2} />
                    </button>
                </div>
            </div>
            <FileUpload onUploadStart={onUploadStart} />
            <div className="flex items-center gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#37383B]">
                    <div
                        className="h-full rounded-full bg-sky-500"
                        style={{ width: `${percent}%` }}
                    />
                </div>
                <span className="text-xs text-white/60">{used}/{total}</span>
            </div>
        </DialogContent>
    )
}

type LeftPanelProps = {
    className?: string;
}

function LeftPanel({ }: LeftPanelProps) {
    const { files, allChecked, toggleAll, toggleOne } = useSources();

    return (
        <Panel className="h-full w-full" title="출처" buttonArea={<PanelRight className="size-4 text-white" strokeWidth={2} />}>
            <div className="flex flex-col gap-3 p-4">
                <SourceAddButton />
                <SourceSearchBox />
                <div className="flex flex-col">
                    <SelectAllRow checked={allChecked} onToggle={toggleAll} />
                    {files.map((file) => (
                        <SourceListItem key={file.id} file={file} onToggle={() => toggleOne(file.id)} />
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
    const { selectedCount } = useSources();
    return (
        <div className="flex flex-col rounded-xl border border-[#37383B] bg-bg">
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
                    <span>출처 {selectedCount}개</span>
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
            className="h-full w-full"
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

type ArtifactCardProps = Artifact & Omit<ComponentProps<'button'>, keyof Artifact>;

function ArtifactCard({ icon: Icon, label, color, beta, chevron, ref, onClick, ...rest }: ArtifactCardProps) {
    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick ?? (() => { })}
            {...rest}
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

type ReportFormat = {
    label: string;
    description: string;
    editable?: boolean;
}

const REPORT_FORMATS: ReportFormat[] = [
    { label: '직접 만들기', description: '구조, 스타일, 어조 등을 지정하여 원하는 방식으로 보고서를 작성하세요.' },
    { label: '브리핑 문서', description: '주요 인사이트와 인용문을 포함한 소스 개요', editable: true },
    { label: '학습 가이드', description: '단답형 퀴즈, 추천 에세이 질문, 핵심 용어집', editable: true },
    { label: '블로그 게시물', description: '읽기 쉬운 기사 형식으로 요약된 유용한 정보', editable: true },
]

const RECOMMENDED_FORMATS: ReportFormat[] = [
    { label: '기술 제안서', description: 'LLM 노드 구조에서 에이전트 기반 반응형 아키텍처로의 전환을 위한 상세 제안서', editable: true },
    { label: '제품 기능 명세서', description: '사용자별 개인 문서 업로드 및 필터링 기능을 포함한 지식 베이스 확장 명세서', editable: true },
    { label: '개념 설명서', description: 'AI 에이전트가 복잡한 대화와 요약 작업을 처리하는 방식을 배우는 학습 도구', editable: true },
    { label: '프로세스 안내서', description: '채팅 메모리와 지식 검색의 원리를 단계별로 이해하는 기초 가이드', editable: true },
]

type ReportFormatCardProps = ReportFormat & {
    onClick?: () => void;
}

function ReportFormatCard({ label, description, editable, onClick }: ReportFormatCardProps) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="relative flex flex-col gap-3 rounded-xl bg-[#2c2a24] p-4 text-left hover:bg-[#34322b] min-h-[140px]"
        >
            {editable && (
                <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-white/5">
                    <Pencil className="size-3.5 text-white/70" strokeWidth={2} />
                </span>
            )}
            <span className="pr-10 text-base font-medium text-white">{label}</span>
            <span className="text-xs leading-relaxed text-white/60">{description}</span>
        </button>
    )
}

const PROMPT_PLACEHOLDER = `예:

새로운 웰니스 음료 출시를 위해 2026년 기능성 음료 시장에 관한 전문적인 경쟁 분석 리뷰를 작성해 줘. 어조는 분석적이고 전략적이어야 하고, 주요 경쟁사의 유통 및 가격 책정에 중점을 두고 출시 전략을 수립해 줘.`;

const LANGUAGES = ['한국어 (기본)', 'English', '日本語', '中文 (简体)', 'Español'] as const;

type ReportCreateViewProps = {
    format: ReportFormat;
    onBack: () => void;
    onClose: () => void;
}

function ReportCreateView({ format, onBack, onClose }: ReportCreateViewProps) {
    const [language, setLanguage] = useState<string>(LANGUAGES[0]);
    const [description, setDescription] = useState<string>('');
    const [templateFiles, setTemplateFiles] = useState<File[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { selectedIds } = useSources();
    const { mutate: createMemo, isPending, isError, reset } = useCreateMemoMutation();

    const hasContent = description.trim().length > 0;
    const hasTemplate = templateFiles.length > 0;
    const hasSources = selectedIds.length > 0;
    const canSubmit = hasContent && hasTemplate && hasSources && !isPending;

    const handleAddFiles = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        setTemplateFiles([files[0]]);
        if (isError) reset();
    };

    const handleRemoveFile = (index: number) => {
        setTemplateFiles((prev) => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = () => {
        if (!canSubmit) return;
        createMemo(
            { sourceIds: selectedIds, template: templateFiles[0], prompt: description },
            { onSuccess: () => onClose() },
        );
    };

    return (
        <>
            <DialogHeader className="flex-row items-center gap-3 border-b border-[#37383B] px-6 py-4 space-y-0">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex size-8 items-center justify-center rounded-md hover:bg-white/5"
                    aria-label="뒤로"
                >
                    <ArrowLeft className="size-5 text-white" strokeWidth={2} />
                </button>
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#2c2a24]">
                    <Files className="size-5 text-amber-200" strokeWidth={2} />
                </div>
                <DialogTitle className="text-lg font-medium text-white">
                    보고서 생성
                </DialogTitle>
                <DialogDescription className="sr-only">
                    {format.label} 형식의 보고서를 생성합니다.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-6 px-6 py-5">
                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-white">언어를 선택하세요</label>
                    <div className="relative">
                        <select
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full appearance-none rounded-lg border border-[#37383B] bg-bg px-4 py-3 pr-10 text-sm text-white outline-none hover:bg-white/5 focus:border-white/30"
                        >
                            {LANGUAGES.map((lang) => (
                                <option key={lang} value={lang} className="bg-bg text-white">{lang}</option>
                            ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white/60" strokeWidth={2} />
                    </div>
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-sm font-semibold text-white">만들려는 보고서를 설명하세요</label>
                    <div className="flex flex-col gap-2 rounded-lg border border-[#37383B] bg-bg px-4 py-3 focus-within:border-white/30">
                        {templateFiles.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                                {templateFiles.map((file, index) => (
                                    <span
                                        key={`${file.name}-${index}`}
                                        className="flex items-center gap-1.5 rounded-full border border-[#37383B] bg-[#2c2a24] py-1 pl-2 pr-1 text-xs text-white"
                                    >
                                        <FileText className="size-3.5 text-amber-200" strokeWidth={2} />
                                        <span className="max-w-[200px] truncate">{file.name}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveFile(index)}
                                            className="flex size-4 items-center justify-center rounded-full hover:bg-white/10"
                                            aria-label={`${file.name} 제거`}
                                        >
                                            <X className="size-3 text-white/70" strokeWidth={2} />
                                        </button>
                                    </span>
                                ))}
                            </div>
                        )}
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder={PROMPT_PLACEHOLDER}
                            rows={6}
                            className="w-full resize-none border-none bg-transparent text-sm leading-relaxed text-white outline-none placeholder:whitespace-pre-line placeholder:text-white/40"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between gap-3">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isPending}
                        className="flex items-center gap-1.5 rounded-full border border-[#37383B] px-3 py-1.5 text-xs text-white/80 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <Paperclip className="size-3.5" strokeWidth={2} />
                        <span>양식 파일 첨부</span>
                    </button>
                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onClick={(e) => {
                            (e.currentTarget as HTMLInputElement).value = '';
                        }}
                        onChange={(e) => {
                            handleAddFiles(e.target.files);
                        }}
                    />
                    <div className="flex items-center gap-3">
                        {isError && (
                            <span className="text-xs text-rose-400">보고서 생성에 실패하였습니다.</span>
                        )}
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!canSubmit}
                            className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${canSubmit
                                ? 'bg-emerald-500 text-black hover:bg-emerald-400'
                                : 'bg-[#37383B] text-white/40'
                                }`}
                        >
                            {isPending && <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />}
                            <span>{isPending ? '생성 중' : '생성'}</span>
                        </button>
                    </div>
                </div>
            </div>
        </>
    )
}

function ReportSelectView({ onSelect }: { onSelect: (format: ReportFormat) => void }) {
    return (
        <>
            <DialogHeader className="flex-row items-center gap-3 border-b border-[#37383B] px-6 py-4 space-y-0">
                <div className="flex size-9 items-center justify-center rounded-lg bg-[#2c2a24]">
                    <Files className="size-5 text-amber-200" strokeWidth={2} />
                </div>
                <DialogTitle className="text-lg font-medium text-white">
                    보고서 생성
                </DialogTitle>
                <DialogDescription className="sr-only">
                    원하는 보고서 형식을 선택하세요.
                </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col gap-6 px-6 py-5">
                <section className="flex flex-col gap-3">
                    <h3 className="text-base font-semibold text-white">형식</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {REPORT_FORMATS.map((format) => (
                            <ReportFormatCard key={format.label} {...format} onClick={() => onSelect(format)} />
                        ))}
                    </div>
                </section>

                <section className="flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                        <Wand2 className="size-4 text-white" strokeWidth={2} />
                        <h3 className="text-base font-semibold text-white">추천 형식</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-3">
                        {RECOMMENDED_FORMATS.map((format) => (
                            <ReportFormatCard key={format.label} {...format} onClick={() => onSelect(format)} />
                        ))}
                    </div>
                </section>
            </div>
        </>
    )
}

function ReportDialog({ onClose }: { onClose: () => void }) {
    const [selectedFormat, setSelectedFormat] = useState<ReportFormat | null>(null);

    return (
        <DialogContent
            className="bg-bg text-white border border-[#37383B] ring-0 sm:max-w-5xl p-0 gap-0 overflow-hidden"
        >
            {selectedFormat ? (
                <ReportCreateView format={selectedFormat} onBack={() => setSelectedFormat(null)} onClose={onClose} />
            ) : (
                <ReportSelectView onSelect={setSelectedFormat} />
            )}
        </DialogContent>
    )
}

function ReportArtifactCard({ artifact }: { artifact: Artifact }) {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <ArtifactCard {...artifact} />
            </DialogTrigger>
            <ReportDialog onClose={() => setOpen(false)} />
        </Dialog>
    )
}

function memoTitle(memo: Memo): string {
    const firstLine = memo.prompt.split('\n')[0]?.trim() ?? '';
    if (firstLine.length === 0) return `메모 ${memo.id}`;
    return firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine;
}

function MemoItem({ memo }: { memo: Memo }) {
    const isInFlight = memo.status === 'PENDING' || memo.status === 'IN_PROGRESS';
    const isFailed = memo.status === 'FAILED';

    return (
        <button
            type="button"
            onClick={() => { }}
            disabled={isInFlight}
            className="flex w-full items-center gap-2 rounded-lg border border-[#37383B] bg-bg px-3 py-2.5 text-left hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-70"
        >
            {isInFlight ? (
                <Loader2 className="size-4 shrink-0 animate-spin text-amber-300" strokeWidth={2} />
            ) : (
                <StickyNote className="size-4 shrink-0 text-amber-300" strokeWidth={2} />
            )}
            <span className="flex-1 truncate text-sm text-white">
                {memoTitle(memo)}
                {isFailed && <span className="ml-1 text-rose-400">(생성 실패)</span>}
            </span>
        </button>
    )
}

type RightPanelProps = {
    className?: string;
}

function MemoList() {
    const { data: memos, isLoading, error } = useMemosQuery();

    if (isLoading) {
        return <span className="px-1 text-xs text-white/50">불러오는 중…</span>;
    }

    if (error) {
        return <span className="px-1 text-xs text-rose-400">메모를 불러오지 못했습니다.</span>;
    }

    if (!memos || memos.length === 0) {
        return <span className="px-1 text-xs text-white/50">아직 메모가 없습니다.</span>;
    }

    return (
        <div className="flex flex-col gap-2">
            {memos.map((memo) => (
                <MemoItem key={memo.id} memo={memo} />
            ))}
        </div>
    )
}

function RightPanel({ }: RightPanelProps) {
    return (
        <Panel
            className="h-full w-full"
            title="스튜디오"
            buttonArea={<PanelLeft className="size-4 text-white" strokeWidth={2} />}
        >
            <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
                <div className="grid grid-cols-2 gap-2">
                    {ARTIFACTS.map((artifact) => {
                        if (artifact.label === '보고서') {
                            return <ReportArtifactCard key={artifact.label} artifact={artifact} />
                        }
                        return <ArtifactCard key={artifact.label} {...artifact} />
                    })}
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
                    <MemoList />
                </div>
            </div>
        </Panel>
    )
}

export { CenterPanel, LeftPanel, RightPanel, SourceAddDialog, SourceProvider };

