import Header from "./components/header/Header";
import { CenterPanel, LeftPanel, RightPanel, SourceProvider } from "./components/panel/ContentPanel";
import ResizableLayout from "./components/panel/ResizableLayout";

function App() {

  return (
    <div className="bg-[#1A1D22] w-full h-full flex flex-col">
      <Header />
      <SourceProvider>
        <ResizableLayout
          className="flex-1 px-8 py-4"
          left={<LeftPanel />}
          center={<CenterPanel />}
          right={<RightPanel />}
        />
      </SourceProvider>
      <footer className="flex items-center justify-center text-center text-xs text-white/40">
        Roundtable AI는 부정확한 정보를 제공할 수 있으므로 중요한 정보는 재차 확인하세요.
      </footer>
    </div>
  )
}

export default App;
