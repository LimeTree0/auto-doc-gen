import Panel from "./Panel";

type LeftPanelProps = {
    className?: string;
}

function LeftPanel({ }: LeftPanelProps) {
    return (
        <Panel className="w-[25vw]" title="출처" buttonArea={<img src="/icons/arrow-right.svg" alt="arrow-right" className="w-4 h-4" />}>

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
