import { AudioWaveform, LayoutGrid, Link2, Plus, Settings, Share2 } from "lucide-react";

function Logo() {
    return (
        <div className="flex size-8 items-center justify-center rounded-full bg-emerald-500/20">
            <AudioWaveform className="size-4 text-emerald-400" strokeWidth={2} />
        </div>
    )
}

function SharedBadge() {
    return (
        <div className="flex items-center gap-1 rounded-sm bg-[#000000] px-2.5 py-0.5">
            <Link2 className="size-4 text-white" strokeWidth={2} />
            <span className="text-xs text-[#F7F3F7]">공유됨</span>
        </div>
    )
}

type HeaderActionProps = {
    icon: React.ReactNode;
    label: string;
}

function HeaderAction({ icon, label }: HeaderActionProps) {
    return (
        <button
            type="button"
            onClick={() => { }}
            className="flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1.5 hover:bg-white/5"
        >
            {icon}
            <span className="text-sm text-white">{label}</span>
        </button>
    )
}

function Header() {
    return (
        <header className="flex items-center justify-between border-b border-[#37383B] px-6 py-3">
            <div className="flex items-center gap-3">
                <Logo />
                <span className="text-base font-semibold text-white">Voice Test Recording</span>
                <SharedBadge />
            </div>
            <div className="flex items-center gap-2">
                <HeaderAction icon={<Plus className="size-4 text-white" strokeWidth={2} />} label="노트북 만들기" />
                <HeaderAction icon={<Share2 className="size-4 text-white" strokeWidth={2} />} label="공유" />
                <HeaderAction icon={<Settings className="size-4 text-white" strokeWidth={2} />} label="설정" />
                <button
                    type="button"
                    onClick={() => { }}
                    className="flex size-9 items-center justify-center rounded-full hover:bg-white/5"
                >
                    <LayoutGrid className="size-5 text-white" strokeWidth={2} />
                </button>
                <div className="size-7 rounded bg-gradient-to-br from-rose-400 to-amber-400" />
            </div>
        </header>
    )
}

export default Header;
