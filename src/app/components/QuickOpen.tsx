import { createSignal, createEffect, createMemo, For, Show } from "solid-js";
import { fileTree, selectFile, type FileNode } from "../stores/files";

interface QuickOpenProps {
  open: boolean;
  onClose: () => void;
}

function flattenFiles(nodes: FileNode[]): FileNode[] {
  const result: FileNode[] = [];
  for (const node of nodes) {
    if (node.type === "file") {
      result.push(node);
    }
    if (node.children) {
      result.push(...flattenFiles(node.children));
    }
  }
  return result;
}

function fuzzyMatch(query: string, text: string): boolean {
  const lower = text.toLowerCase();
  const q = query.toLowerCase();
  let qi = 0;
  for (let i = 0; i < lower.length && qi < q.length; i++) {
    if (lower[i] === q[qi]) qi++;
  }
  return qi === q.length;
}

export function QuickOpen(props: QuickOpenProps) {
  const [query, setQuery] = createSignal("");
  const [selectedIndex, setSelectedIndex] = createSignal(0);
  let inputRef: HTMLInputElement | undefined;

  const allFiles = createMemo(() => flattenFiles(fileTree()));
  const filtered = createMemo(() => {
    const q = query();
    if (!q) return allFiles();
    return allFiles().filter((f) => fuzzyMatch(q, f.name));
  });

  createEffect(() => {
    if (props.open) {
      setQuery("");
      setSelectedIndex(0);
      requestAnimationFrame(() => inputRef?.focus());
    }
  });

  createEffect(() => {
    filtered();
    setSelectedIndex(0);
  });

  const handleKeyDown = (e: KeyboardEvent) => {
    const items = filtered();
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, items.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (items[selectedIndex()]) {
          selectFile(items[selectedIndex()]);
          props.onClose();
        }
        break;
      case "Escape":
        e.preventDefault();
        props.onClose();
        break;
    }
  };

  return (
    <Show when={props.open}>
      <div
        class="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
        style={{ "background-color": "rgba(0,0,0,0.4)" }}
        onClick={() => props.onClose()}
      >
        <div
          class="w-[500px] overflow-hidden rounded-lg shadow-2xl"
          style={{ "background-color": "var(--background)", border: "1px solid var(--border)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div class="p-2">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search files..."
              value={query()}
              onInput={(e) => setQuery(e.currentTarget.value)}
              onKeyDown={handleKeyDown}
              class="w-full rounded bg-transparent px-3 py-2 text-sm outline-none"
              style={{ color: "var(--foreground)" }}
            />
          </div>

          <div class="max-h-[300px] overflow-y-auto border-t" style={{ "border-color": "var(--border)" }}>
            <For each={filtered().slice(0, 20)}>
              {(file, index) => (
                <button
                  class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors"
                  style={{
                    color: "var(--foreground)",
                    "background-color": selectedIndex() === index() ? "var(--accent)" : "transparent",
                  }}
                  onClick={() => {
                    selectFile(file);
                    props.onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index())}
                >
                  <svg class="size-4 shrink-0" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <div class="min-w-0 flex-1">
                    <div class="truncate font-medium">{file.name}</div>
                    <div class="truncate text-xs" style={{ color: "var(--muted-foreground)" }}>
                      {file.id}
                    </div>
                  </div>
                </button>
              )}
            </For>

            <Show when={filtered().length === 0}>
              <div class="px-4 py-8 text-center text-sm" style={{ color: "var(--muted-foreground)" }}>
                No files found
              </div>
            </Show>
          </div>
        </div>
      </div>
    </Show>
  );
}
