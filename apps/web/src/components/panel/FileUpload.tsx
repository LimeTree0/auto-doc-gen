import { ClipboardPaste, HardDrive, Link2, Upload, type LucideIcon } from "lucide-react";
import { useRef, useState } from "react";
import { useUploadSourcesMutation } from "@/api/source";

type SourceUploadButton = {
    icon: LucideIcon;
    label: string;
    iconClassName?: string;
}

function SourceUploadOptionButton({ icon: Icon, label, iconClassName }: SourceUploadButton) {
    return (
        <button
            type="button"
            onClick={() => { }}
            className="flex items-center gap-1.5 rounded-full border border-[#37383B] bg-bg px-3 py-1.5 hover:bg-white/5"
        >
            <Icon className={`size-3.5 text-white ${iconClassName ?? ''}`} strokeWidth={2} />
            <span className="text-xs text-white">{label}</span>
        </button>
    )
}

type SourceUploadFileButtonProps = {
    handleUploadFiles: (files: File[]) => void;
}

function SourceUploadFileButton({ handleUploadFiles }: SourceUploadFileButtonProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const handleClickButton = () => {
        if (inputRef.current) {
            inputRef.current.click();
        }
    }
    return (
        <button
            type="button"
            onClick={handleClickButton}
            className="flex items-center gap-1.5 rounded-full border border-[#37383B] bg-bg px-3 py-1.5 hover:bg-white/5"
        >
            <Upload className="size-3.5 text-white" strokeWidth={2} />
            <span className="text-xs text-white">파일 업로드</span>
            <input ref={inputRef} type="file" multiple onChange={(event) => {
                event.preventDefault();
                const files = event.target.files;
                if (files) {
                    handleUploadFiles(Array.from(files) as File[]);
                }
            }} className="hidden" />
        </button>
    )
}
type FileUploadProps = {
    onUploadStart?: () => void;
}

function FileUpload({ onUploadStart }: FileUploadProps = {}) {
    const [isDragOver, setIsDragOver] = useState<boolean>(false);
    const { mutate: uploadFiles, isPending, error } = useUploadSourcesMutation();

    const handleUploadFiles = (files: File[]) => {
        if (files.length === 0) return;
        uploadFiles(files);
        onUploadStart?.();
    }

    const handleUploadInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (files) {
            handleUploadFiles(Array.from(files));
        }
    }

    const handleDropFiles = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
        const files = event.dataTransfer.files;

        if (files) {
            handleUploadFiles(Array.from(files) as File[]);
        }
    }

    const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(true);
    }

    const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        setIsDragOver(false);
    }

    return <div
        onDrop={handleDropFiles}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-busy={isPending}
        className={`rounded-xl border border-dashed px-6 py-10 flex flex-col items-center gap-5 transition-colors ${isDragOver
            ? 'border-white/60 bg-white/5'
            : 'border-[#37383B] bg-[#22262b]/40'
            } ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
        <div className="flex flex-col items-center gap-1">
            <span className="text-base text-white">
                {isPending ? '업로드 중…' : '또는 파일 드롭'}
            </span>
            <span className="text-xs text-white/50">PDF, 이미지, 문서, 오디오 등</span>
            <input type="file" multiple onChange={handleUploadInputEvent} className="hidden" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
            <SourceUploadFileButton handleUploadFiles={handleUploadFiles} />
            <SourceUploadOptionButton icon={Link2} label="웹사이트" iconClassName="text-rose-400" />
            <SourceUploadOptionButton icon={HardDrive} label="Drive" iconClassName="text-sky-400" />
            <SourceUploadOptionButton icon={ClipboardPaste} label="복사된 텍스트" />
        </div>
        {error && (
            <span className="text-xs text-rose-400">업로드 실패: {error.message}</span>
        )}
    </div>;
}

export default FileUpload;