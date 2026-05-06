import { useRef, useState, type ReactNode } from "react";

const LEFT_MIN = 240;
const CENTER_MIN = 480;
const RIGHT_MIN = 240;

const DEFAULT_LEFT = 320;
const DEFAULT_RIGHT = 320;

type ResizableLayoutProps = {
    left: ReactNode;
    center: ReactNode;
    right: ReactNode;
    className?: string;
}

function ResizableLayout({ left, center, right, className }: ResizableLayoutProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [leftWidth, setLeftWidth] = useState<number>(DEFAULT_LEFT);
    const [rightWidth, setRightWidth] = useState<number>(DEFAULT_RIGHT);
    const [isResizing, setIsResizing] = useState<boolean>(false);

    const startResize = (side: 'left' | 'right') => (event: React.MouseEvent<HTMLDivElement>) => {
        event.preventDefault();
        const startX = event.clientX;
        const startLeft = leftWidth;
        const startRight = rightWidth;
        setIsResizing(true);

        const handleMove = (ev: MouseEvent) => {
            const containerWidth = containerRef.current?.clientWidth ?? 0;
            if (containerWidth === 0) return;
            const delta = ev.clientX - startX;

            if (side === 'left') {
                const max = containerWidth - rightWidth - CENTER_MIN;
                const next = Math.max(LEFT_MIN, Math.min(startLeft + delta, max));
                setLeftWidth(next);
            } else {
                const max = containerWidth - leftWidth - CENTER_MIN;
                const next = Math.max(RIGHT_MIN, Math.min(startRight - delta, max));
                setRightWidth(next);
            }
        };

        const handleUp = () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('mouseup', handleUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            setIsResizing(false);
        };

        window.addEventListener('mousemove', handleMove);
        window.addEventListener('mouseup', handleUp);
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
    };

    return (
        <div ref={containerRef} className={`flex min-h-0 flex-row ${className ?? ''}`}>
            <div style={{ width: leftWidth }} className="shrink-0">
                {left}
            </div>
            <ResizeHandle onMouseDown={startResize('left')} />
            <div className="min-w-0 flex-1">
                {center}
            </div>
            <ResizeHandle onMouseDown={startResize('right')} />
            <div style={{ width: rightWidth }} className="shrink-0">
                {right}
            </div>
            {/* iframe 등 별도 browsing context가 mousemove를 가로채는 것을 막기 위한 드래그용 오버레이 */}
            {isResizing && <div className="fixed inset-0 z-[9999] cursor-col-resize" />}
        </div>
    )
}

function ResizeHandle({ onMouseDown }: { onMouseDown: (e: React.MouseEvent<HTMLDivElement>) => void }) {
    return (
        <div
            role="separator"
            aria-orientation="vertical"
            onMouseDown={onMouseDown}
            className="w-4 shrink-0 cursor-col-resize"
        />
    )
}

export default ResizableLayout;
