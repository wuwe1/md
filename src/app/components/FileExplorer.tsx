import { createSignal, For, Show } from "solid-js";
import {
  fileTree,
  selectedFile,
  selectFile,
  type FileNode,
} from "../stores/files";

function FileTreeItem(props: { node: FileNode; level: number }) {
  const [expanded, setExpanded] = createSignal(true);
  const isSelected = () => selectedFile()?.id === props.node.id;

  const handleClick = () => {
    if (props.node.type === "directory") {
      setExpanded(!expanded());
    } else {
      selectFile(props.node);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        class="flex w-full items-center gap-1.5 rounded px-1.5 py-1 transition-colors"
        classList={{
          "bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100": isSelected(),
          "hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300": !isSelected(),
        }}
        style={{ "padding-left": `${props.level * 12 + 6}px` }}
      >
        <Show when={props.node.type === "directory"}>
          <span class="shrink-0 text-zinc-400 dark:text-zinc-500">
            <svg class="size-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <Show when={expanded()} fallback={<polyline points="9 18 15 12 9 6" />}>
                <polyline points="6 9 12 15 18 9" />
              </Show>
            </svg>
          </span>
        </Show>

        <Show
          when={props.node.type === "directory"}
          fallback={
            <svg class="size-3.5 shrink-0 text-zinc-400 dark:text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          }
        >
          <svg class="size-3.5 shrink-0 text-blue-500 dark:text-blue-400" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2 6a2 2 0 0 1 2-2h5l2 2h9a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6z" />
          </svg>
        </Show>

        <span class="truncate text-xs">{props.node.name}</span>
      </button>

      <Show when={props.node.type === "directory" && expanded() && props.node.children}>
        <For each={props.node.children}>
          {(child) => <FileTreeItem node={child} level={props.level + 1} />}
        </For>
      </Show>
    </div>
  );
}

export function FileExplorer() {
  const [search, setSearch] = createSignal("");

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

  return (
    <div class="flex h-full flex-col" style={{ "background-color": "var(--background)" }}>
      <div class="flex h-9 shrink-0 items-center border-b px-2" style={{ "border-color": "var(--border)" }}>
        <input
          type="text"
          placeholder="Search files..."
          value={search()}
          onInput={(e) => setSearch(e.currentTarget.value)}
          class="w-full rounded px-2 py-1 text-xs outline-none"
          style={{ background: "var(--muted)", color: "var(--foreground)" }}
        />
      </div>

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
            {(node) => <FileTreeItem node={node} level={0} />}
          </For>
        </Show>
      </div>
    </div>
  );
}
