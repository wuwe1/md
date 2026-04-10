import { createSignal, For, Show } from "solid-js";
import { confirm } from "@tauri-apps/plugin-dialog";
import {
  fileTree,
  selectedFile,
  selectFile,
  isFolderExpanded,
  toggleFolder,
  expandAll,
  foldAll,
  expandAllRoot,
  foldAllRoot,
  type FileNode,
} from "../stores/files";
import {
  projects,
  selectedProjectId,
  selectProject,
  removeProject,
} from "../stores/projects";
import { addProjectViaDialog } from "../lib/menu-handler";
import {
  showHidden,
  showGitignored,
  toggleShowHidden,
  toggleShowGitignored,
} from "../stores/file-filters";

function FileTreeItem(props: { node: FileNode; level: number; onContextMenu: (node: FileNode, e: MouseEvent) => void }) {
  const isSelected = () => selectedFile()?.id === props.node.id;

  const handleClick = () => {
    if (props.node.type === "directory") {
      toggleFolder(props.node.id);
    } else {
      selectFile(props.node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        onContextMenu={(e) => {
          e.preventDefault();
          if (props.node.type === "directory") {
            props.onContextMenu(props.node, e);
          }
        }}
        class="flex w-full items-center gap-1.5 rounded px-1.5 py-1 transition-colors"
        style={{
          "padding-left": `${props.level * 12 + 6}px`,
          "background-color": isSelected() ? "var(--accent)" : "transparent",
          color: isSelected() ? "var(--primary)" : "var(--foreground)",
        }}
        onMouseEnter={(e) => { if (!isSelected()) e.currentTarget.style.backgroundColor = "var(--accent)"; }}
        onMouseLeave={(e) => { if (!isSelected()) e.currentTarget.style.backgroundColor = "transparent"; }}
      >
        <Show when={props.node.type === "directory"}>
          <span class="shrink-0" style={{ color: "var(--muted-foreground)" }}>
            <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <Show when={isFolderExpanded(props.node.id)} fallback={<polyline points="9 18 15 12 9 6" />}>
                <polyline points="6 9 12 15 18 9" />
              </Show>
            </svg>
          </span>
        </Show>

        <Show
          when={props.node.type === "directory"}
          fallback={
            <svg class="size-3.5 shrink-0" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        >
          <svg class="size-3.5 shrink-0" style={{ color: "var(--primary)" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
          </svg>
        </Show>

        <span class="truncate text-xs">{props.node.name}</span>
      </button>

      <Show when={props.node.type === "directory" && isFolderExpanded(props.node.id) && props.node.children}>
        <For each={props.node.children}>
          {(child) => <FileTreeItem node={child} level={props.level + 1} onContextMenu={props.onContextMenu} />}
        </For>
      </Show>
    </div>
  );
}

interface ContextMenuState {
  node: FileNode;
  x: number;
  y: number;
}

export function FileExplorer() {
  const [search, setSearch] = createSignal("");
  const [contextMenu, setContextMenu] = createSignal<ContextMenuState | null>(null);
  const [popoverOpen, setPopoverOpen] = createSignal(false);

  const selectedProject = () => projects().find((p) => p.id === selectedProjectId());

  function filterTree(nodes: FileNode[], query: string): FileNode[] {
    if (!query) return nodes;
    const lower = query.toLowerCase();
    return nodes.reduce<FileNode[]>((acc, node) => {
      if (node.type === "file") {
        if (node.name.toLowerCase().includes(lower)) acc.push(node);
      } else if (node.children) {
        const filtered = filterTree(node.children, query);
        if (filtered.length > 0) {
          acc.push({ ...node, children: filtered });
        }
      }
      return acc;
    }, []);
  }

  const filteredTree = () => filterTree(fileTree(), search());

  const handleFolderContextMenu = (node: FileNode, e: MouseEvent) => {
    setContextMenu({ node, x: e.clientX, y: e.clientY });
  };

  const closeContextMenu = () => setContextMenu(null);

  const handleSelectProject = (id: string) => {
    selectProject(id);
    setPopoverOpen(false);
  };

  const handleRemoveProject = async (id: string, e: MouseEvent) => {
    e.stopPropagation();
    const project = projects().find((p) => p.id === id);
    const confirmed = await confirm(`Remove "${project?.name}" from the list?`, { title: "Remove Project", kind: "warning" });
    if (confirmed) {
      await removeProject(id);
      if (projects().length === 0) setPopoverOpen(false);
    }
  };

  const handleAddProject = async () => {
    setPopoverOpen(false);
    await addProjectViaDialog();
  };

  return (
    <div class="flex h-full select-none flex-col" style={{ "background-color": "var(--background)" }} onContextMenu={(e) => e.preventDefault()}>
      {/* Project selector */}
      <div class="relative flex h-9 shrink-0 items-center gap-1 border-b px-2" style={{ "border-color": "var(--border)" }}>
        <button
          onClick={() => setPopoverOpen(!popoverOpen())}
          class="flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1 transition-colors"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
        >
          <Show when={selectedProject()} fallback={
            <span class="truncate text-xs" style={{ color: "var(--muted-foreground)" }}>Select Project</span>
          }>
            {(project) => (
              <>
                <div class="flex size-4 shrink-0 items-center justify-center rounded" style={{ "background-color": project().color }}>
                  <svg class="size-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
                  </svg>
                </div>
                <span class="truncate text-xs font-medium" style={{ color: "var(--foreground)" }}>{project().name}</span>
              </>
            )}
          </Show>
          <svg class="ml-auto size-3 shrink-0" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        <button
          onClick={handleAddProject}
          class="flex size-6 shrink-0 items-center justify-center rounded transition-colors"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          title="Add project"
        >
          <svg class="size-3" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
        </button>

        {/* Project popover */}
        <Show when={popoverOpen()}>
          <div class="fixed inset-0 z-40" onClick={() => setPopoverOpen(false)} />
          <div
            class="absolute left-1 right-1 top-full z-50 mt-1 overflow-hidden rounded-lg py-1 shadow-lg"
            style={{
              "background-color": "var(--background)",
              border: "1px solid var(--border)",
            }}
          >
            <div class="max-h-[240px] overflow-y-auto">
              <For each={projects()}>
                {(project) => (
                  <button
                    onClick={() => handleSelectProject(project.id)}
                    class="group flex w-full items-center gap-2 px-2 py-1.5 transition-colors"
                    style={{
                      "background-color": selectedProjectId() === project.id ? "var(--accent)" : "transparent",
                      color: selectedProjectId() === project.id ? "var(--primary)" : "var(--foreground)",
                    }}
                    onMouseEnter={(e) => { if (selectedProjectId() !== project.id) e.currentTarget.style.backgroundColor = "var(--accent)"; }}
                    onMouseLeave={(e) => { if (selectedProjectId() !== project.id) e.currentTarget.style.backgroundColor = "transparent"; }}
                  >
                    <div class="flex size-4 shrink-0 items-center justify-center rounded" style={{ "background-color": project.color }}>
                      <svg class="size-2.5 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
                      </svg>
                    </div>
                    <span class="truncate text-xs font-medium">{project.name}</span>
                    <button
                      onClick={(e) => handleRemoveProject(project.id, e)}
                      class="ml-auto flex size-4 shrink-0 items-center justify-center rounded opacity-0 transition-opacity group-hover:opacity-100"
                      style={{ color: "var(--muted-foreground)" }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--destructive)"; e.currentTarget.style.color = "var(--destructive-foreground)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--muted-foreground)"; }}
                      title="Remove project"
                    >
                      <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </button>
                )}
              </For>
            </div>
            <div class="border-t px-1 pt-1" style={{ "border-color": "var(--border)" }}>
              <button
                onClick={handleAddProject}
                class="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors"
                style={{ color: "var(--muted-foreground)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
              >
                <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Add Project
              </button>
            </div>
          </div>
        </Show>
      </div>

      {/* Search + toolbar */}
      <div class="flex h-9 shrink-0 items-center gap-1 border-b px-2" style={{ "border-color": "var(--border)" }}>
        <input
          type="text"
          placeholder="Search files..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="min-w-0 flex-1 rounded px-2 py-1 text-xs outline-none"
          style={{ background: "var(--muted)", color: "var(--foreground)" }}
        />
        <button
          onClick={expandAllRoot}
          class="flex size-6 shrink-0 items-center justify-center rounded transition-colors"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          title="Expand all"
        >
          <svg class="size-3.5" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="7 13 12 18 17 13" />
            <polyline points="7 6 12 11 17 6" />
          </svg>
        </button>
        <button
          onClick={foldAllRoot}
          class="flex size-6 shrink-0 items-center justify-center rounded transition-colors"
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          title="Fold all"
        >
          <svg class="size-3.5" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="7 11 12 6 17 11" />
            <polyline points="7 18 12 13 17 18" />
          </svg>
        </button>
        <button
          onClick={toggleShowHidden}
          class="flex size-6 shrink-0 items-center justify-center rounded transition-colors"
          style={{ "background-color": showHidden() ? "var(--accent)" : "transparent" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
          onMouseLeave={(e) => { if (!showHidden()) e.currentTarget.style.backgroundColor = "transparent"; }}
          title={showHidden() ? "Hide dotfiles" : "Show dotfiles"}
        >
          <svg class="size-3.5" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="2" />
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          </svg>
        </button>
        <button
          onClick={toggleShowGitignored}
          class="flex size-6 shrink-0 items-center justify-center rounded transition-colors"
          style={{ "background-color": showGitignored() ? "var(--accent)" : "transparent" }}
          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
          onMouseLeave={(e) => { if (!showGitignored()) e.currentTarget.style.backgroundColor = "transparent"; }}
          title={showGitignored() ? "Hide gitignored" : "Show gitignored"}
        >
          <svg class="size-3.5" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.6 10.59L8.38 4.8l1.69 1.7-1.22 1.21 2.27 2.27L9.91 11.2l-2.27-2.27L6.4 10.16l2.27 2.28-1.21 1.22 1.7 1.69L3.28 21.17a1 1 0 01-1.41 0l-2.12-2.12a1 1 0 010-1.42l5.87-5.87L3.28 9.42l1.06-1.06L2.6 10.59zm18.79-7.15l2.12 2.12a1 1 0 010 1.42L17.63 13l-1.7-1.69 1.22-1.22-2.27-2.27 1.22-1.22 2.27 2.27 1.23-1.23-2.27-2.27 1.22-1.22-1.7-1.69L21.39 3.44a1 1 0 011.41 0z" transform="scale(0.85) translate(1.5,1.5)" />
          </svg>
        </button>
      </div>

      {/* File tree */}
      <div class="flex-1 overflow-y-auto px-1.5 py-1">
        <Show
          when={filteredTree().length > 0}
          fallback={
            <div class="flex h-full items-center justify-center">
              <span class="text-xs" style={{ color: "var(--muted-foreground)" }}>No markdown files</span>
            </div>
          }
        >
          <For each={filteredTree()}>
            {(node) => <FileTreeItem node={node} level={0} onContextMenu={handleFolderContextMenu} />}
          </For>
        </Show>
      </div>

      {/* Folder context menu */}
      <Show when={contextMenu()}>
        {(menu) => (
          <>
            <div class="fixed inset-0 z-50" onClick={closeContextMenu} onContextMenu={(e) => { e.preventDefault(); closeContextMenu(); }} />
            <div
              class="fixed z-50 min-w-[140px] overflow-hidden rounded-lg py-1 shadow-lg"
              style={{
                left: `${menu().x}px`,
                top: `${menu().y}px`,
                "background-color": "var(--background)",
                border: "1px solid var(--border)",
              }}
            >
              <button
                class="flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                style={{ color: "var(--foreground)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                onClick={() => { expandAll(menu().node); closeContextMenu(); }}
              >
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
                Expand All
              </button>
              <button
                class="flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                style={{ color: "var(--foreground)" }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                onClick={() => { foldAll(menu().node); closeContextMenu(); }}
              >
                <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                Fold All
              </button>
            </div>
          </>
        )}
      </Show>
    </div>
  );
}
