import {
  chatKeys,
  streamMessage,
  useCreateConversationMutation,
  useMessagesQuery,
  type Message as ChatMessage,
} from "@/api/chat";
import {
  downloadMemoDocx,
  memoKeys,
  useCreateMemoMutation,
  useDeleteMemoMutation,
  useMemoHtmlQuery,
  useMemosQuery,
  type Memo,
} from "@/api/memo";
import {
  inferSourceType,
  sourceKeys,
  useAddSourceFromMemoMutation,
  useDeleteSourceMutation,
  usePendingMemoConversionIds,
  useSourcesQuery,
  type SourceType,
} from "@/api/source";
import { useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { LucideIcon } from "lucide-react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  AudioLines,
  BarChart3,
  Check,
  ChevronDown,
  ChevronRight,
  Download,
  FileSpreadsheet,
  FileText,
  Files,
  Globe,
  HelpCircle,
  Layers,
  Loader2,
  MoreVertical,
  MoveRight,
  Network,
  PanelLeft,
  PanelRight,
  Paperclip,
  Pencil,
  Plus,
  Presentation,
  RefreshCw,
  Search,
  Sparkles,
  Square,
  StickyNote,
  Table,
  Trash2,
  Video,
  Wand2,
  X,
} from "lucide-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type FormEvent,
  type ReactNode,
} from "react";
import { Streamdown } from "streamdown";
import FileUpload from "./FileUpload";
import Panel from "./Panel";

function SourceAddButton() {
  const textColor = "text-[#ABABAB]";
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
  );
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
            onClick={() => {}}
            className="flex items-center gap-1.5 rounded-full border border-[#37383B] px-3 py-1 hover:bg-white/5"
          >
            <Network className="size-3.5 text-white" strokeWidth={2} />
            <span className="text-xs text-white">웹</span>
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="flex items-center gap-1.5 rounded-full border border-[#37383B] px-3 py-1 hover:bg-white/5"
          >
            <Network className="size-3.5 text-white" strokeWidth={2} />
            <span className="text-xs text-white">Fast Research</span>
          </button>
        </div>
        <button
          type="button"
          onClick={() => {}}
          className="flex size-7 items-center justify-center rounded-full border border-[#37383B] hover:bg-white/5"
        >
          <MoveRight className="size-3.5 text-white" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}

type SourceFile = {
  id: number;
  name: string;
  type: SourceType;
  checked: boolean;
};

type SourceContextValue = {
  files: SourceFile[];
  selectedCount: number;
  selectedIds: number[];
  allChecked: boolean;
  toggleAll: () => void;
  toggleOne: (id: number) => void;
};

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
    <SourceContext.Provider
      value={{
        files,
        selectedCount,
        selectedIds,
        allChecked,
        toggleAll,
        toggleOne,
      }}
    >
      {children}
    </SourceContext.Provider>
  );
}

function useSources() {
  const ctx = useContext(SourceContext);
  if (!ctx) throw new Error("useSources must be used within SourceProvider");
  return ctx;
}

function FileTypeIcon({ type }: { type: SourceType }) {
  if (type === "xlsx")
    return (
      <FileSpreadsheet className="size-4 text-emerald-400" strokeWidth={2} />
    );
  if (type === "pdf")
    return <FileText className="size-4 text-rose-400" strokeWidth={2} />;
  if (type === "audio")
    return <AudioLines className="size-4 text-fuchsia-400" strokeWidth={2} />;
  return <FileText className="size-4 text-sky-400" strokeWidth={2} />;
}

function SourceCheckbox({ checked }: { checked: boolean }) {
  return (
    <span
      className={`flex size-4 shrink-0 items-center justify-center rounded border ${
        checked ? "bg-emerald-500 border-emerald-500" : "border-white/30"
      }`}
    >
      {checked && <Check className="size-3 text-white" strokeWidth={3} />}
    </span>
  );
}

function SelectAllRow({
  checked,
  onToggle,
}: {
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="flex w-full items-center justify-end gap-2 rounded-md px-2 py-2 hover:bg-white/5"
    >
      <span className="text-sm text-white">모두 선택</span>
      <SourceCheckbox checked={checked} />
    </button>
  );
}

function SourceListItem({
  file,
  onToggle,
}: {
  file: SourceFile;
  onToggle: () => void;
}) {
  const { mutate: deleteSource } = useDeleteSourceMutation();

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };

  const handleDelete = () => {
    deleteSource(file.id);
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onToggle}
      onKeyDown={handleKeyDown}
      className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-2 hover:bg-white/5"
    >
      <FileTypeIcon type={file.type} />
      <span className="flex-1 truncate text-left text-sm text-white">
        {file.name}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(e) => e.stopPropagation()}
            aria-label="소스 메뉴 열기"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
          >
            <MoreVertical className="size-4" strokeWidth={2} />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem onSelect={handleDelete}>
            <Trash2 className="size-4 text-rose-400" strokeWidth={2} />
            <span>삭제</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SourceCheckbox checked={file.checked} />
    </div>
  );
}

type SourceAddDialogProps = {
  onUploadStart?: () => void;
};

function SourceAddDialog({ onUploadStart }: SourceAddDialogProps = {}) {
  const used = 3;
  const total = 50;
  const percent = Math.min(100, Math.round((used / total) * 100));

  return (
    <DialogContent className="bg-bg text-white border border-[#37383B] ring-0 sm:max-w-2xl p-6 gap-5">
      <DialogHeader className="items-center pt-2">
        <DialogTitle className="text-center text-lg font-medium text-white">
          <span className="text-sky-300">웹사이트</span>를 활용해 AI 오디오 및
          동영상 오버뷰 만들기
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
              onClick={() => {}}
              className="flex items-center gap-1 rounded-full border border-[#37383B] bg-bg px-3 py-1 hover:bg-white/5"
            >
              <Globe className="size-3.5 text-white" strokeWidth={2} />
              <span className="text-xs text-white">웹</span>
              <ChevronDown className="size-3 text-white/60" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => {}}
              className="flex items-center gap-1 rounded-full border border-[#37383B] bg-bg px-3 py-1 hover:bg-white/5"
            >
              <Sparkles className="size-3.5 text-white" strokeWidth={2} />
              <span className="text-xs text-white">Fast Research</span>
              <ChevronDown className="size-3 text-white/60" strokeWidth={2} />
            </button>
          </div>
          <button
            type="button"
            onClick={() => {}}
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
        <span className="text-xs text-white/60">
          {used}/{total}
        </span>
      </div>
    </DialogContent>
  );
}

type LeftPanelProps = {
  className?: string;
};

function PendingSourceRow({ title }: { title: string }) {
  return (
    <div className="flex w-full items-center gap-2 rounded-md px-2 py-2 opacity-70">
      <Loader2
        className="size-4 shrink-0 animate-spin text-white/60"
        strokeWidth={2}
      />
      <span className="flex-1 truncate text-left text-sm text-white/80">
        {title}
      </span>
      <span className="shrink-0 text-xs text-white/40">업로드 중…</span>
    </div>
  );
}

function LeftPanel({}: LeftPanelProps) {
  const { files, allChecked, toggleAll, toggleOne } = useSources();
  const pendingMemoIds = usePendingMemoConversionIds();
  const { data: memos } = useMemosQuery();

  const pendingTitle = (memoId: number) => {
    const memo = memos?.find((m) => m.id === memoId);
    return memo ? memoTitle(memo) : `메모 ${memoId}`;
  };

  return (
    <Panel
      className="h-full w-full"
      title="출처"
      buttonArea={<PanelRight className="size-4 text-white" strokeWidth={2} />}
    >
      <div className="flex flex-col gap-3 p-4">
        <SourceAddButton />
        <SourceSearchBox />
        <div className="flex flex-col">
          <SelectAllRow checked={allChecked} onToggle={toggleAll} />
          {pendingMemoIds.map((memoId, idx) => (
            <PendingSourceRow
              key={`pending-memo-${memoId}-${idx}`}
              title={pendingTitle(memoId)}
            />
          ))}
          {files.map((file) => (
            <SourceListItem
              key={file.id}
              file={file}
              onToggle={() => toggleOne(file.id)}
            />
          ))}
        </div>
      </div>
    </Panel>
  );
}

// 다운로드 링크인지 확인. /api/v1/memos/{id}/docx 패턴은 항상 다운로드 카드로 렌더한다.
const DOWNLOAD_LINK_PATTERN = /\/api\/v1\/memos\/\d+\/docx$/;
const isDownloadLink = (href: string | undefined): boolean =>
  href != null && DOWNLOAD_LINK_PATTERN.test(href);

function DownloadLinkCard({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      download
      className="not-prose my-1 inline-flex max-w-full items-center gap-3 rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-white no-underline transition-colors hover:border-emerald-400 hover:bg-emerald-500/20"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/20">
        <FileText className="size-4 text-emerald-300" strokeWidth={2} />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium text-white">{children}</span>
        <span className="text-xs text-emerald-200/80">
          클릭하여 다운로드 · DOCX
        </span>
      </span>
      <Download className="size-4 shrink-0 text-emerald-300" strokeWidth={2} />
    </a>
  );
}

// Streamdown은 기본적으로 외부 링크 클릭 시 안전 경고 모달을 띄운다.
// 다운로드 링크는 카드, 그 외 링크는 평범한 색상 앵커로 직접 렌더한다.
const STREAMDOWN_COMPONENTS = {
  a: ({
    node: _node,
    children,
    href,
    ...rest
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    node?: unknown;
  }) => {
    if (isDownloadLink(href)) {
      return <DownloadLinkCard href={href as string}>{children}</DownloadLinkCard>;
    }
    return (
      <a
        {...rest}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sky-400 underline underline-offset-2 hover:text-sky-300"
      >
        {children}
      </a>
    );
  },
};

function ThinkingLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 pl-11 text-xs text-white/60">
      <Loader2 className="size-3.5 animate-spin text-emerald-400" strokeWidth={2} />
      <span>{label}</span>
    </div>
  );
}

function BotMessage({ content }: { content: string }) {
  return (
    <div className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/20">
        <Sparkles className="size-4 text-emerald-400" strokeWidth={2} />
      </div>
      <div className="streamdown-message flex min-w-0 flex-1 flex-col gap-3 text-sm leading-relaxed text-white/90">
        {content.length > 0 ? (
          <Streamdown
            components={STREAMDOWN_COMPONENTS}
            linkSafety={{ enabled: false }}
          >
            {content}
          </Streamdown>
        ) : (
          <span className="inline-flex h-4 items-center gap-1 text-white/40">
            <span className="size-1.5 animate-pulse rounded-full bg-white/40" />
            <span className="size-1.5 animate-pulse rounded-full bg-white/40 [animation-delay:120ms]" />
            <span className="size-1.5 animate-pulse rounded-full bg-white/40 [animation-delay:240ms]" />
          </span>
        )}
      </div>
    </div>
  );
}

function UserMessage({ content }: { content: string }) {
  return (
    <div className="flex justify-end">
      <div className="max-w-[80%] rounded-2xl bg-[#2d3137] px-4 py-2.5">
        <p className="whitespace-pre-wrap text-sm text-white">{content}</p>
      </div>
    </div>
  );
}

type ChatInputProps = {
  isStreaming: boolean;
  disabled: boolean;
  onSend: (content: string, files: File[]) => void;
  onStop: () => void;
};

function ChatInput({ isStreaming, disabled, onSend, onStop }: ChatInputProps) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const trimmed = value.trim();
  const canSend = !disabled && !isStreaming && trimmed.length > 0;

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSend) return;
    onSend(trimmed, files);
    setValue("");
    setFiles([]);
  };

  const handlePickFiles = (picked: FileList | null) => {
    if (!picked || picked.length === 0) return;
    setFiles((prev) => [...prev, ...Array.from(picked)]);
  };

  const handleRemoveFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col rounded-xl border border-[#37383B] bg-bg"
    >
      {files.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3 pt-3">
          {files.map((file, index) => (
            <span
              key={`${file.name}-${index}`}
              className="flex items-center gap-1.5 rounded-full border border-[#37383B] bg-[#2c2a24] py-1 pl-2 pr-1 text-xs text-white"
            >
              <FileText
                className="size-3.5 text-amber-200"
                strokeWidth={2}
              />
              <span className="max-w-[180px] truncate">{file.name}</span>
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
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={disabled}
        className="border-none bg-transparent px-4 pt-3 pb-2 text-sm text-white outline-none placeholder:text-white/40 disabled:cursor-not-allowed disabled:opacity-60"
        placeholder="무엇이든 물어보세요"
      />
      <div className="flex items-center justify-between px-3 pb-2">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isStreaming}
          aria-label="파일 첨부"
          className="flex size-7 items-center justify-center rounded-full text-white/70 hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Paperclip className="size-4" strokeWidth={2} />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onClick={(e) => {
            (e.currentTarget as HTMLInputElement).value = "";
          }}
          onChange={(e) => handlePickFiles(e.target.files)}
        />
        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            aria-label="생성 중지"
            className="flex size-7 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"
          >
            <Square
              className="size-3.5 fill-white text-white"
              strokeWidth={2}
            />
          </button>
        ) : (
          <button
            type="submit"
            disabled={!canSend}
            aria-label="전송"
            className="flex size-7 items-center justify-center rounded-full bg-emerald-500 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:bg-white/10"
          >
            <ArrowUp className="size-4 text-black" strokeWidth={2.5} />
          </button>
        )}
      </div>
    </form>
  );
}

type CenterPanelProps = {
  className?: string;
};

function CenterPanel({}: CenterPanelProps) {
  const queryClient = useQueryClient();
  const { mutate: createConversation, isPending: isCreating } =
    useCreateConversationMutation();
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [streamingContent, setStreamingContent] = useState<string | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const { data: messages } = useMessagesQuery(conversationId);
  const messageListRef = useRef<HTMLDivElement>(null);

  const ensureConversation = (after?: (id: number) => void) => {
    createConversation(undefined, {
      onSuccess: (created) => {
        setConversationId(created.id);
        setStreamingContent(null);
        setStreamError(null);
        setCurrentStep(null);
        after?.(created.id);
      },
    });
  };

  // 첫 진입 시 자동으로 새 대화를 만든다.
  useEffect(() => {
    if (conversationId == null && !isCreating) {
      ensureConversation();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 메시지/스트림 변할 때 스크롤 하단 고정
  useEffect(() => {
    const el = messageListRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, streamingContent]);

  const handleSend = async (content: string, files: File[]) => {
    if (conversationId == null) return;
    const id = conversationId;

    // 유저 메시지를 캐시에 낙관적으로 추가 (백엔드도 시작 시점에 저장하므로 invalidate로 정합화됨)
    const optimisticUser: ChatMessage = {
      id: -Date.now(),
      conversationId: id,
      role: "USER",
      content,
      createdAt: new Date().toISOString(),
    };
    queryClient.setQueryData<ChatMessage[]>(
      chatKeys.messages(id),
      (prev) => [...(prev ?? []), optimisticUser],
    );

    setStreamingContent("");
    setStreamError(null);
    setCurrentStep(null);

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      await streamMessage(
        id,
        content,
        files,
        {
          onDelta: (chunk) => {
            // 어시스턴트 토큰이 흐르기 시작하면 thinking 단계는 끝났다고 보고 숨긴다.
            setCurrentStep(null);
            setStreamingContent((prev) => (prev ?? "") + chunk);
          },
          onStep: (label) => setCurrentStep(label),
          onDone: () => {
            setStreamingContent(null);
            setCurrentStep(null);
            queryClient.invalidateQueries({
              queryKey: chatKeys.messages(id),
            });
            // 도구가 자료 파일을 소스로 영속화했을 수 있으니 출처 패널도 갱신
            queryClient.invalidateQueries({ queryKey: sourceKeys.all });
            queryClient.invalidateQueries({ queryKey: memoKeys.all });
          },
          onError: (message) => {
            setStreamError(message);
            setStreamingContent(null);
            setCurrentStep(null);
            queryClient.invalidateQueries({
              queryKey: chatKeys.messages(id),
            });
          },
        },
        controller.signal,
      );
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        // 사용자가 중지 — 부분 응답은 버리고 서버 상태로 동기화
        setStreamingContent(null);
        setCurrentStep(null);
        queryClient.invalidateQueries({
          queryKey: chatKeys.messages(id),
        });
      } else {
        setStreamError((err as Error).message);
        setStreamingContent(null);
        setCurrentStep(null);
      }
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
    }
  };

  const handleStop = () => {
    abortRef.current?.abort();
  };

  const handleNewConversation = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    ensureConversation();
  };

  const isStreaming = streamingContent != null;

  return (
    <Panel
      className="h-full w-full"
      title="채팅"
      buttonArea={
        <button
          type="button"
          onClick={handleNewConversation}
          disabled={isCreating}
          aria-label="새 대화"
          className="text-white/70 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className="size-4" strokeWidth={2} />
        </button>
      }
    >
      <div className="flex h-full flex-col">
        <div
          ref={messageListRef}
          className="flex flex-1 flex-col gap-6 overflow-y-auto p-4"
        >
          {messages?.map((message) =>
            message.role === "USER" ? (
              <UserMessage key={message.id} content={message.content} />
            ) : (
              <BotMessage key={message.id} content={message.content} />
            ),
          )}
          {isStreaming && (
            <>
              {currentStep && <ThinkingLine label={currentStep} />}
              <BotMessage content={streamingContent ?? ""} />
            </>
          )}
          {streamError && (
            <span className="text-xs text-rose-400">{streamError}</span>
          )}
        </div>
        <div className="flex flex-col gap-2 p-4">
          <ChatInput
            isStreaming={isStreaming}
            disabled={conversationId == null}
            onSend={handleSend}
            onStop={handleStop}
          />
        </div>
      </div>
    </Panel>
  );
}

type ArtifactColor = "blue" | "yellow" | "green" | "pink" | "orange" | "cyan";

const ARTIFACT_COLOR_MAP: Record<ArtifactColor, string> = {
  blue: "bg-sky-400/15 text-sky-300",
  yellow: "bg-amber-400/15 text-amber-300",
  green: "bg-emerald-400/15 text-emerald-300",
  pink: "bg-pink-400/15 text-pink-300",
  orange: "bg-orange-400/15 text-orange-300",
  cyan: "bg-cyan-400/15 text-cyan-300",
};

type Artifact = {
  icon: LucideIcon;
  label: string;
  color: ArtifactColor;
  beta?: boolean;
  chevron?: boolean;
};

const ARTIFACTS: Artifact[] = [
  { icon: AudioLines, label: "AI 오디오 오버뷰", color: "blue", chevron: true },
  {
    icon: Presentation,
    label: "슬라이드 자료",
    color: "yellow",
    beta: true,
    chevron: true,
  },
  { icon: Video, label: "동영상 개요", color: "green", chevron: true },
  { icon: Network, label: "마인드맵", color: "pink" },
  { icon: FileText, label: "보고서", color: "yellow", chevron: true },
  { icon: Layers, label: "플래시카드", color: "orange", chevron: true },
  { icon: HelpCircle, label: "퀴즈", color: "cyan", chevron: true },
  {
    icon: BarChart3,
    label: "인포그래픽",
    color: "pink",
    beta: true,
    chevron: true,
  },
  { icon: Table, label: "데이터 표", color: "blue", chevron: true },
];

type ArtifactCardProps = Artifact &
  Omit<ComponentProps<"button">, keyof Artifact>;

function ArtifactCard({
  icon: Icon,
  label,
  color,
  beta,
  chevron,
  ref,
  onClick,
  ...rest
}: ArtifactCardProps) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onClick ?? (() => {})}
      {...rest}
      className={`flex flex-col gap-2 rounded-xl border border-border p-2.5 text-left hover:bg-white/5 ${ARTIFACT_COLOR_MAP[color]}`}
    >
      <div className="flex w-full items-start justify-between">
        <div
          className={`flex size-4 shrink-0 items-center justify-center rounded-lg ${ARTIFACT_COLOR_MAP[color]}`}
        >
          <Icon className="size-4" strokeWidth={2} />
        </div>
        {chevron && (
          <ChevronRight
            className="size-4 shrink-0 text-white/40"
            strokeWidth={2}
          />
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
  );
}

type ReportFormat = {
  label: string;
  description: string;
  editable?: boolean;
};

const REPORT_FORMATS: ReportFormat[] = [
  {
    label: "직접 만들기",
    description:
      "구조, 스타일, 어조 등을 지정하여 원하는 방식으로 보고서를 작성하세요.",
  },
  {
    label: "브리핑 문서",
    description: "주요 인사이트와 인용문을 포함한 소스 개요",
    editable: true,
  },
  {
    label: "학습 가이드",
    description: "단답형 퀴즈, 추천 에세이 질문, 핵심 용어집",
    editable: true,
  },
  {
    label: "블로그 게시물",
    description: "읽기 쉬운 기사 형식으로 요약된 유용한 정보",
    editable: true,
  },
];

const RECOMMENDED_FORMATS: ReportFormat[] = [
  {
    label: "기술 제안서",
    description:
      "LLM 노드 구조에서 에이전트 기반 반응형 아키텍처로의 전환을 위한 상세 제안서",
    editable: true,
  },
  {
    label: "제품 기능 명세서",
    description:
      "사용자별 개인 문서 업로드 및 필터링 기능을 포함한 지식 베이스 확장 명세서",
    editable: true,
  },
  {
    label: "개념 설명서",
    description:
      "AI 에이전트가 복잡한 대화와 요약 작업을 처리하는 방식을 배우는 학습 도구",
    editable: true,
  },
  {
    label: "프로세스 안내서",
    description:
      "채팅 메모리와 지식 검색의 원리를 단계별로 이해하는 기초 가이드",
    editable: true,
  },
];

type ReportFormatCardProps = ReportFormat & {
  onClick?: () => void;
};

function ReportFormatCard({
  label,
  description,
  editable,
  onClick,
}: ReportFormatCardProps) {
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
      <span className="text-xs leading-relaxed text-white/60">
        {description}
      </span>
    </button>
  );
}

const PROMPT_PLACEHOLDER = `예:

새로운 웰니스 음료 출시를 위해 2026년 기능성 음료 시장에 관한 전문적인 경쟁 분석 리뷰를 작성해 줘. 어조는 분석적이고 전략적이어야 하고, 주요 경쟁사의 유통 및 가격 책정에 중점을 두고 출시 전략을 수립해 줘.`;

const LANGUAGES = [
  "한국어 (기본)",
  "English",
  "日本語",
  "中文 (简体)",
  "Español",
] as const;

type ReportCreateViewProps = {
  format: ReportFormat;
  onBack: () => void;
  onClose: () => void;
};

function ReportCreateView({ format, onBack, onClose }: ReportCreateViewProps) {
  const [language, setLanguage] = useState<string>(LANGUAGES[0]);
  const [description, setDescription] = useState<string>("");
  const [templateFiles, setTemplateFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { selectedIds } = useSources();
  const {
    mutate: createMemo,
    isPending,
    isError,
    reset,
  } = useCreateMemoMutation();

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
      {
        sourceIds: selectedIds,
        template: templateFiles[0],
        prompt: description,
      },
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
          <label className="text-sm font-semibold text-white">
            언어를 선택하세요
          </label>
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full appearance-none rounded-lg border border-[#37383B] bg-bg px-4 py-3 pr-10 text-sm text-white outline-none hover:bg-white/5 focus:border-white/30"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang} value={lang} className="bg-bg text-white">
                  {lang}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-white/60"
              strokeWidth={2}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-white">
            만들려는 보고서를 설명하세요
          </label>
          <div className="flex flex-col gap-2 rounded-lg border border-[#37383B] bg-bg px-4 py-3 focus-within:border-white/30">
            {templateFiles.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {templateFiles.map((file, index) => (
                  <span
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-1.5 rounded-full border border-[#37383B] bg-[#2c2a24] py-1 pl-2 pr-1 text-xs text-white"
                  >
                    <FileText
                      className="size-3.5 text-amber-200"
                      strokeWidth={2}
                    />
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
              (e.currentTarget as HTMLInputElement).value = "";
            }}
            onChange={(e) => {
              handleAddFiles(e.target.files);
            }}
          />
          <div className="flex items-center gap-3">
            {isError && (
              <span className="text-xs text-rose-400">
                보고서 생성에 실패하였습니다.
              </span>
            )}
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!canSubmit}
              className={`flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-colors ${
                canSubmit
                  ? "bg-emerald-500 text-black hover:bg-emerald-400"
                  : "bg-[#37383B] text-white/40"
              }`}
            >
              {isPending && (
                <Loader2 className="size-3.5 animate-spin" strokeWidth={2} />
              )}
              <span>{isPending ? "생성 중" : "생성"}</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function ReportSelectView({
  onSelect,
}: {
  onSelect: (format: ReportFormat) => void;
}) {
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
              <ReportFormatCard
                key={format.label}
                {...format}
                onClick={() => onSelect(format)}
              />
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
              <ReportFormatCard
                key={format.label}
                {...format}
                onClick={() => onSelect(format)}
              />
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function ReportDialog({ onClose }: { onClose: () => void }) {
  const [selectedFormat, setSelectedFormat] = useState<ReportFormat | null>(
    null,
  );

  return (
    <DialogContent className="bg-bg text-white border border-[#37383B] ring-0 sm:max-w-5xl p-0 gap-0 overflow-hidden">
      {selectedFormat ? (
        <ReportCreateView
          format={selectedFormat}
          onBack={() => setSelectedFormat(null)}
          onClose={onClose}
        />
      ) : (
        <ReportSelectView onSelect={setSelectedFormat} />
      )}
    </DialogContent>
  );
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
  );
}

function memoTitle(memo: Memo): string {
  const firstLine = memo.prompt.split("\n")[0]?.trim() ?? "";
  if (firstLine.length === 0) return `메모 ${memo.id}`;
  return firstLine.length > 40 ? `${firstLine.slice(0, 40)}…` : firstLine;
}

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (sec < 60) return `${sec}초 전`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}분 전`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}시간 전`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}일 전`;
  const mo = Math.floor(day / 30);
  if (mo < 12) return `${mo}달 전`;
  return `${Math.floor(mo / 12)}년 전`;
}

function MemoItem({
  memo,
  onClick,
  onDeleted,
}: {
  memo: Memo;
  onClick?: () => void;
  onDeleted?: (id: number) => void;
}) {
  const isInFlight = memo.status === "PENDING" || memo.status === "IN_PROGRESS";
  const isFailed = memo.status === "FAILED";
  const isCompleted = memo.status === "COMPLETED";
  const isClickable = isCompleted && Boolean(onClick);
  const { mutate: convertToSource } = useAddSourceFromMemoMutation();
  const { mutate: deleteMemoMutation } = useDeleteMemoMutation();

  const handleRowClick = () => {
    if (isClickable) onClick?.();
  };

  const handleRowKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!isClickable) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onClick?.();
    }
  };

  const handleDownload = async () => {
    try {
      await downloadMemoDocx(memo.id, `${memoTitle(memo)}.docx`);
    } catch (err) {
      console.error("docx 다운로드 실패", err);
    }
  };

  const handleConvertToSource = () => {
    convertToSource({ memoId: memo.id });
  };

  const handleDelete = () => {
    deleteMemoMutation(memo.id, {
      onSuccess: () => onDeleted?.(memo.id),
    });
  };

  const showMenu = isCompleted || isFailed;
  const subtitle = `소스 ${memo.sourceIds.length}개 · ${timeAgo(memo.createdAt)}`;

  return (
    <div
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={handleRowClick}
      onKeyDown={handleRowKeyDown}
      aria-disabled={isInFlight || undefined}
      className={`flex w-full items-center gap-2 rounded-lg border border-[#37383B] bg-bg px-3 py-2.5 ${isClickable ? "cursor-pointer hover:bg-white/5" : ""} ${isInFlight ? "opacity-70" : ""}`}
    >
      {isInFlight ? (
        <Loader2
          className="size-4 shrink-0 animate-spin text-amber-300"
          strokeWidth={2}
        />
      ) : (
        <StickyNote
          className="size-4 shrink-0 text-amber-300"
          strokeWidth={2}
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm text-white">
          {memoTitle(memo)}
          {isFailed && <span className="ml-1 text-rose-400">(생성 실패)</span>}
        </span>
        <span className="truncate text-xs text-white/50">{subtitle}</span>
      </div>
      {showMenu && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              aria-label="메모 메뉴 열기"
              className="flex size-7 shrink-0 items-center justify-center rounded-md text-white/60 hover:bg-white/10 hover:text-white"
            >
              <MoreVertical className="size-4" strokeWidth={2} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
            {isCompleted && (
              <>
                <DropdownMenuItem onSelect={handleDownload}>
                  <FileText className="size-4 text-white/80" strokeWidth={2} />
                  <span>Docx로 내보내기</span>
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={handleConvertToSource}>
                  <Files className="size-4 text-white/80" strokeWidth={2} />
                  <span>소스로 변환</span>
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem onSelect={handleDelete}>
              <Trash2 className="size-4 text-rose-400" strokeWidth={2} />
              <span>삭제</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

type RightPanelProps = {
  className?: string;
};

function MemoList({
  onSelectMemo,
  onMemoDeleted,
}: {
  onSelectMemo: (id: number) => void;
  onMemoDeleted: (id: number) => void;
}) {
  const { data: memos, isLoading, error } = useMemosQuery();

  if (isLoading) {
    return <span className="px-1 text-xs text-white/50">불러오는 중…</span>;
  }

  if (error) {
    return (
      <span className="px-1 text-xs text-rose-400">
        메모를 불러오지 못했습니다.
      </span>
    );
  }

  if (!memos || memos.length === 0) {
    return (
      <span className="px-1 text-xs text-white/50">아직 메모가 없습니다.</span>
    );
  }

  const sortedMemos = [...memos].sort((a, b) => {
    const aPending = a.status === "PENDING" || a.status === "IN_PROGRESS";
    const bPending = b.status === "PENDING" || b.status === "IN_PROGRESS";
    if (aPending !== bPending) return aPending ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });

  return (
    <div className="flex flex-col gap-2">
      {sortedMemos.map((memo) => (
        <MemoItem
          key={memo.id}
          memo={memo}
          onClick={
            memo.status === "COMPLETED"
              ? () => onSelectMemo(memo.id)
              : undefined
          }
          onDeleted={onMemoDeleted}
        />
      ))}
    </div>
  );
}

function MemoHtmlFrame({ html }: { html: string }) {
  const ref = useRef<HTMLIFrameElement>(null);

  // srcdoc + sandbox=allow-same-origin: 부모/자식 CSS가 서로에게 영향을 주지 않으면서
  // 같은 출처로 유지해 contentDocument를 읽어 자동 높이 조절이 가능. allow-scripts는
  // 지정하지 않아 외부 HTML 내 스크립트는 실행되지 않음.
  const handleLoad = () => {
    const frame = ref.current;
    if (!frame) return;

    const measure = () => {
      try {
        const doc = frame.contentDocument;
        const body = doc?.body;
        if (!body || !doc?.defaultView) return;
      } catch {
        // 접근 불가 시 무시 — 기본 높이 유지
      }
    };

    // layout이 settled된 다음 프레임에 측정
    requestAnimationFrame(measure);
  };

  return (
    <iframe
      ref={ref}
      title="메모 본문"
      srcDoc={html}
      sandbox="allow-same-origin"
      onLoad={handleLoad}
      className="block w-full border-0 bg-white h-full"
    />
  );
}

function MemoDetailView({
  memoId,
  onBack,
}: {
  memoId: number;
  onBack: () => void;
}) {
  const { data: memos } = useMemosQuery();
  const memo = memos?.find((m) => m.id === memoId);
  const title = memo ? memoTitle(memo) : `메모 ${memoId}`;
  const { data: html, isLoading, error } = useMemoHtmlQuery(memoId);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      await downloadMemoDocx(memoId, `${title}.docx`);
    } catch (err) {
      console.error("docx 다운로드 실패", err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex h-full min-w-0 flex-col">
      <div className="flex items-center gap-2 border-b border-[#37383B] px-4 py-3">
        <button
          type="button"
          onClick={onBack}
          className="flex size-8 items-center justify-center rounded-md hover:bg-white/5"
          aria-label="뒤로"
        >
          <ArrowLeft className="size-5 text-white" strokeWidth={2} />
        </button>
        <span className="flex-1 truncate text-sm font-medium text-white">
          {title}
        </span>
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex size-8 shrink-0 items-center justify-center rounded-md text-white/80 hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Docx로 다운로드"
        >
          {isDownloading ? (
            <Loader2 className="size-5 animate-spin" strokeWidth={2} />
          ) : (
            <Download className="size-5" strokeWidth={2} />
          )}
        </button>
      </div>
      <div className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        {isLoading && (
          <span className="block px-4 py-3 text-xs text-white/50">
            불러오는 중…
          </span>
        )}
        {error && (
          <span className="block px-4 py-3 text-xs text-rose-400">
            {error.message}
          </span>
        )}
        {html && <MemoHtmlFrame html={html} />}
      </div>
    </div>
  );
}

function RightPanel({}: RightPanelProps) {
  const [selectedMemoId, setSelectedMemoId] = useState<number | null>(null);

  const handleMemoDeleted = (id: number) => {
    if (selectedMemoId === id) {
      setSelectedMemoId(null);
    }
  };

  return (
    <Panel
      className="h-full w-full"
      title="스튜디오"
      buttonArea={<PanelLeft className="size-4 text-white" strokeWidth={2} />}
    >
      {selectedMemoId != null ? (
        <MemoDetailView
          memoId={selectedMemoId}
          onBack={() => setSelectedMemoId(null)}
        />
      ) : (
        <div className="flex h-full flex-col gap-4 overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-2">
            {ARTIFACTS.map((artifact) => {
              if (artifact.label === "보고서") {
                return (
                  <ReportArtifactCard
                    key={artifact.label}
                    artifact={artifact}
                  />
                );
              }
              return <ArtifactCard key={artifact.label} {...artifact} />;
            })}
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-sm font-medium text-white">메모</span>
              <button
                type="button"
                onClick={() => {}}
                className="flex size-6 items-center justify-center rounded-full hover:bg-white/5"
              >
                <Plus className="size-4 text-white" strokeWidth={2} />
              </button>
            </div>
            <MemoList
              onSelectMemo={setSelectedMemoId}
              onMemoDeleted={handleMemoDeleted}
            />
          </div>
        </div>
      )}
    </Panel>
  );
}

export { CenterPanel, LeftPanel, RightPanel, SourceAddDialog, SourceProvider };
