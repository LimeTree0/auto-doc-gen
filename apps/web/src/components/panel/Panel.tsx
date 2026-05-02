type PanelProps = {
    title: string;
    buttonArea: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

function Panel({ title, buttonArea, className, children }: PanelProps) {
    const classes = `bg-[#22262b] rounded-2xl flex flex-col overflow-hidden ${className}`;
    return (
        <div className={classes}>
            <div className="bg-[#22262b] p-4 border-b border-[#37383B] flex flex-row justify-between items-center">
                <span className="text-white text-sm">{title}</span>
                {buttonArea}
            </div>
            <div className="flex-1 min-h-0">
                {children}
            </div>
        </div>
    )
}

export default Panel;