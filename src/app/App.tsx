import { createSignal, onMount } from "solid-js";
import { ResizablePanels } from "./components/layout/ResizablePanels";
import { ProjectList } from "./components/ProjectList";
import { FileExplorer } from "./components/FileExplorer";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { QuickOpen } from "./components/QuickOpen";
import { initTheme } from "./stores/theme";
import { zoomIn, zoomOut, zoomReset } from "./stores/zoom";
import { setupMenuHandler, setupDragDrop } from "./lib/menu-handler";

export default function App() {
  const [quickOpenVisible, setQuickOpenVisible] = createSignal(false);
  const [showToc, setShowToc] = createSignal(true);

  onMount(() => {
    initTheme();
    setupMenuHandler({
      onExportPdf: () => window.print(),
      onToggleSidebar: () => {},
      onQuickOpen: () => setQuickOpenVisible(true),
      onZoomIn: zoomIn,
      onZoomOut: zoomOut,
      onZoomReset: zoomReset,
    });
    setupDragDrop();
  });

  return (
    <div class="flex size-full flex-col" style={{ "background-color": "var(--background)" }}>
      <div class="flex-1 overflow-hidden border-t" style={{ "border-color": "var(--border)" }}>
        <ResizablePanels
          panels={[
            {
              default: 20,
              min: 15,
              max: 30,
              content: () => <ProjectList />,
            },
            {
              default: 25,
              min: 20,
              max: 40,
              content: () => <FileExplorer />,
            },
            {
              default: 55,
              min: 40,
              max: 100,
              content: () => (
                <MarkdownViewer
                  showToc={showToc()}
                  onToggleToc={() => setShowToc((v) => !v)}
                />
              ),
            },
          ]}
        />
      </div>

      <QuickOpen
        open={quickOpenVisible()}
        onClose={() => setQuickOpenVisible(false)}
      />
    </div>
  );
}
