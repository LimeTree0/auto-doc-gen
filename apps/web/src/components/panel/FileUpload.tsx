import { ClipboardPaste, HardDrive, Link2, Upload, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";

type SourceUploadButton = {
    icon: LucideIcon;
    label: string;
    iconClassName?: string;
}

const SOURCE_UPLOAD_BUTTONS: SourceUploadButton[] = [
    { icon: Upload, label: '파일 업로드' },
    { icon: Link2, label: '웹사이트', iconClassName: 'text-rose-400' },
    { icon: HardDrive, label: 'Drive', iconClassName: 'text-sky-400' },
    { icon: ClipboardPaste, label: '복사된 텍스트' },
]

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

function FileUpload() {
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [isDragOver, setIsDragOver] = useState<boolean>(false);

    const handleUploadInputEvent = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = event.target.files;

        if (files) {
            handleUploadFiles(Array.from(files));
        }
    }

    const handleUploadFiles = (files: File[]) => {
        setUploadedFiles(files);
    }

    const handleDropFiles = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault();
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
        className={`rounded-xl border border-dashed px-6 py-10 flex flex-col items-center gap-5 transition-colors ${isDragOver
                ? 'border-white/60 bg-white/5'
                : 'border-[#37383B] bg-[#22262b]/40'
            }`}
    >
        <div className="flex flex-col items-center gap-1">
            <span className="text-base text-white">또는 파일 드롭</span>
            <span className="text-xs text-white/50">PDF, 이미지, 문서, 오디오 등</span>
            <input type="file" multiple onChange={handleUploadInputEvent} className="hidden" />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-2">
            {SOURCE_UPLOAD_BUTTONS.map((button) => (
                <SourceUploadOptionButton key={button.label} {...button} />
            ))}
        </div>
    </div>;
}

export default FileUpload;