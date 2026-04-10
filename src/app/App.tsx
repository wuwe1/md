import { createSignal, onMount } from "solid-js";
import { ResizablePanels } from "./components/layout/ResizablePanels";
import { FileExplorer } from "./components/FileExplorer";
import { MarkdownViewer } from "./components/MarkdownViewer";
import { QuickOpen } from "./components/QuickOpen";
import { initTheme } from "./stores/theme";
import { initFileFilters } from "./stores/file-filters";
import { loadProjects } from "./stores/projects";
import { zoomIn, zoomOut, zoomReset } from "./stores/zoom";
import { setupMenuHandler, setupDragDrop } from "./lib/menu-handler";

export default function App() {
  const [quickOpenVisible, setQuickOpenVisible] = createSignal(false);
  const [showToc, setShowToc] = createSignal(true);

  onMount(() => {
    initTheme();
    initFileFilters();
    loadProjects();
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
              default: 22,
              min: 15,
              max: 40,
              content: () => <FileExplorer />,
            },
            {
              default: 78,
              min: 50,
              max: 85,
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
