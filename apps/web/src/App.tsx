import { CenterPanel, LeftPanel, RightPanel } from "./components/panel/ContentPanel";

function App() {

  return (
    <div className="bg-[#1A1D22] w-full h-full flex flex-col gap-4">
      <div>
        <h1 className="text-4xl font-bold text-white">Hello World</h1>
      </div>
      <div className="flex flex-row rounded-lg gap-4 flex-1 pb-8 px-8">
        <LeftPanel />
        <CenterPanel />
        <RightPanel />
      </div>
    </div>
  )
}

export default App;
