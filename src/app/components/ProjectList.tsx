import { For, onMount } from "solid-js";
import {
  projects,
  selectedProjectId,
  selectProject,
  removeProject,
  loadProjects,
} from "../stores/projects";
import { addProjectViaDialog } from "../lib/menu-handler";

export function ProjectList() {
  onMount(() => {
    loadProjects();
  });

  const handleContextMenu = (id: string, e: MouseEvent) => {
    e.preventDefault();
    removeProject(id);
  };

  return (
    <div class="flex h-full flex-col" style={{ "background-color": "var(--sidebar)" }}>
      <div class="flex h-9 shrink-0 items-center justify-between border-b px-3" style={{ "border-color": "var(--border)" }}>
        <span class="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
          Projects
        </span>
        <button
          onClick={addProjectViaDialog}
          class="flex size-5 items-center justify-center rounded transition-colors hover:bg-zinc-200 dark:hover:bg-zinc-700"
        >
          <svg class="size-3" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>
      </div>

      <div class="flex-1 overflow-y-auto px-1.5 py-1">
        <For each={projects()}>
          {(project) => (
            <button
              onClick={() => selectProject(project.id)}
              onContextMenu={(e) => handleContextMenu(project.id, e)}
              class="mb-0.5 flex w-full items-center gap-2 rounded px-2 py-1.5 transition-colors"
              classList={{
                "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100":
                  selectedProjectId() === project.id,
                "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300":
                  selectedProjectId() !== project.id,
              }}
            >
              <div
                class="flex size-5 shrink-0 items-center justify-center rounded"
                style={{ "background-color": project.color }}
              >
                <svg class="size-3 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
                </svg>
              </div>
              <span class="truncate text-xs font-medium">{project.name}</span>
            </button>
          )}
        </For>
      </div>
    </div>
  );
}
