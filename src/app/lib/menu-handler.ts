import { listen } from "@tauri-apps/api/event";
import { open } from "@tauri-apps/plugin-dialog";
import { stat } from "@tauri-apps/plugin-fs";
import { addProject } from "../stores/projects";

export interface MenuActions {
  onExportPdf: () => void;
  onToggleSidebar: () => void;
  onQuickOpen: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export function setupMenuHandler(actions: MenuActions) {
  listen<string>("menu-event", (event) => {
    switch (event.payload) {
      case "add_project":
        addProjectViaDialog();
        break;
      case "export_pdf":
        actions.onExportPdf();
        break;
      case "toggle_sidebar":
        actions.onToggleSidebar();
        break;
      case "quick_open":
        actions.onQuickOpen();
        break;
      case "zoom_in":
        actions.onZoomIn();
        break;
      case "zoom_out":
        actions.onZoomOut();
        break;
      case "zoom_reset":
        actions.onZoomReset();
        break;
    }
  });
}

export async function addProjectViaDialog() {
  const selected = await open({ directory: true, multiple: false });
  if (selected) {
    await addProject(selected);
  }
}

export function setupDragDrop() {
  listen<{ paths: string[] }>("tauri://drag-drop", async (event) => {
    for (const path of event.payload.paths) {
      try {
        const info = await stat(path);
        if (info.isDirectory) {
          await addProject(path);
        }
      } catch {
        // ignore invalid paths
      }
    }
  });
}
