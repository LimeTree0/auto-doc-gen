type PanelProps = {
    title: string;
    buttonArea: React.ReactNode;
    className?: string;
    children?: React.ReactNode;
}

function Panel({ title, buttonArea, className, children }: PanelProps) {
    const classes = `bg-[#22262b] rounded-2xl ${className}`;
    return (
        <div className={classes}>
            <div className="flex flex-row">
                <div className="bg-[#22262b] p-4 border-b border-[#37383B] flex flex-row justify-between items-center w-full">
                    <span className="text-white text-sm">{title}</span>
                    {buttonArea}
                </div>
            </div>
            <div>
                {children}
            </div>
        </div>
    )
}

export default Panel;