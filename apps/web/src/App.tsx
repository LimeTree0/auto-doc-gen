import { CenterPanel, LeftPanel, RightPanel } from "./components/panel/ContentPanel";

function App() {

  return (
    <div className="bg-[#1A1D22] w-full h-full flex flex-col">
      <div>
        <h1 className="text-4xl font-bold text-white">Hello World</h1>
      </div>
      <div className="flex flex-row rounded-lg gap-4 flex-1 px-8 pb-3">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>
      <footer className="flex items-center justify-center text-center text-xs text-white/40">
        Roundtable AI는 부정확한 정보를 제공할 수 있으므로 중요한 정보는 재차 확인하세요.
      </footer>
    </div>
  )
}

export default App;
