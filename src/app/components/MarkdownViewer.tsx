import { createSignal, createEffect, For, Show } from "solid-js";
import { fileContent, selectedFile } from "../stores/files";
import { renderMarkdown } from "../lib/markdown";
import { renderMermaidBlocks } from "../lib/mermaid-renderer";
import { currentTheme, setTheme, type ThemeName } from "../stores/theme";
import { TableOfContents } from "./TableOfContents";

interface MarkdownViewerProps {
  showToc: boolean;
  onToggleToc: () => void;
}

const themeOptions: { value: ThemeName; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
];

function SettingsMenu() {
  const [open, setOpen] = createSignal(false);

  return (
    <div class="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        class="flex items-center gap-0.5 rounded px-1.5 py-1 text-[11px] transition-colors"
        style={{ color: "var(--muted-foreground)" }}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
      >
        <svg class="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
        <svg class="size-2.5" viewBox="0 0 24 24" fill="currentColor">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      <Show when={open()}>
        <div class="fixed inset-0 z-50" onClick={() => setOpen(false)} />
        <div
          class="absolute right-0 top-full z-50 mt-1 min-w-[180px] overflow-hidden rounded-lg py-1 shadow-lg"
          style={{ "background-color": "var(--background)", border: "1px solid var(--border)" }}
        >
          <div class="px-3 py-1">
            <span class="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
              Theme
            </span>
          </div>
          <For each={themeOptions}>
            {(t) => (
              <button
                onClick={() => { setTheme(t.value); setOpen(false); }}
                class="flex w-full items-center gap-2 px-3 py-1.5 text-xs transition-colors"
                style={{
                  color: "var(--foreground)",
                  "background-color": currentTheme() === t.value ? "var(--accent)" : "transparent",
                }}
                onMouseEnter={(e) => { if (currentTheme() !== t.value) e.currentTarget.style.backgroundColor = "var(--accent)"; }}
                onMouseLeave={(e) => { if (currentTheme() !== t.value) e.currentTarget.style.backgroundColor = "transparent"; }}
              >
                <span class="w-4 text-center text-[10px]">{currentTheme() === t.value ? "✓" : ""}</span>
                {t.label}
              </button>
            )}
          </For>

          <div class="my-1" style={{ height: "1px", "background-color": "var(--border)" }} />

          <button
            onClick={() => { window.print(); setOpen(false); }}
            class="flex w-full items-center justify-between px-3 py-1.5 text-xs transition-colors"
            style={{ color: "var(--foreground)" }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
          >
            <span>Export PDF</span>
            <span style={{ color: "var(--muted-foreground)" }} class="text-[10px]">⌘⇧E</span>
          </button>
        </div>
      </Show>
    </div>
  );
}

export function MarkdownViewer(props: MarkdownViewerProps) {
  const [html, setHtml] = createSignal("");
  let contentRef: HTMLDivElement | undefined;
  let scrollRef: HTMLDivElement | undefined;

  createEffect(async () => {
    const content = fileContent();
    if (!content) {
      setHtml("");
      return;
    }
    const file = selectedFile();
    const basePath = file ? file.path.substring(0, file.path.lastIndexOf("/")) : undefined;
    const rendered = await renderMarkdown(content, basePath);
    setHtml(rendered);
  });

  // Reset scroll to top when content changes
  createEffect(() => {
    html();
    if (scrollRef) scrollRef.scrollTop = 0;
  });

  createEffect(() => {
    html();
    const theme = currentTheme();
    requestAnimationFrame(() => {
      if (contentRef) {
        renderMermaidBlocks(contentRef, theme);
      }
    });
  });

  return (
    <div class="flex h-full flex-col" style={{ "background-color": "var(--background)" }}>
      <div class="flex h-9 shrink-0 items-center justify-between border-b px-3" style={{ "border-color": "var(--border)" }}>
        <span class="truncate text-xs font-medium" style={{ color: "var(--foreground)" }}>
          {selectedFile()?.name ?? ""}
        </span>

        <div class="flex items-center gap-0.5">
          <Show when={selectedFile()}>
            <button
              onClick={props.onToggleToc}
              class="flex size-6 items-center justify-center rounded transition-colors"
              style={{ "background-color": props.showToc ? "var(--accent)" : "transparent" }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "var(--accent)"}
              onMouseLeave={(e) => { if (!props.showToc) e.currentTarget.style.backgroundColor = "transparent"; }}
              title="Table of Contents"
            >
              <svg class="size-3.5" style={{ color: "var(--muted-foreground)" }} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
            </button>
          </Show>
          <SettingsMenu />
        </div>
      </div>

      <div class="flex flex-1 overflow-hidden">
        <div ref={scrollRef} class="flex-1 overflow-y-auto">
          <Show
            when={html()}
            fallback={
              <div class="flex h-full items-center justify-center" style={{ color: "var(--muted-foreground)" }}>
                <div class="text-center">
                  <svg class="mx-auto mb-4 size-16 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  <p>Select a file to view its content</p>
                </div>
              </div>
            }
          >
            <div class="mx-auto max-w-4xl px-6 py-6">
              <article ref={contentRef} class="markdown-content" innerHTML={html()} />
            </div>
          </Show>
        </div>

        <Show when={props.showToc && html()}>
          <TableOfContents contentEl={contentRef} content={html()} />
        </Show>
      </div>
    </div>
  );
}
