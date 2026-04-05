import { createSignal, createEffect, createMemo, For, Show, onCleanup } from "solid-js";

export interface TocEntry {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  contentEl: HTMLElement | undefined;
  /** Reactive signal — TOC re-extracts headings whenever this value changes */
  content?: string;
}

export function TableOfContents(props: TableOfContentsProps) {
  const [entries, setEntries] = createSignal<TocEntry[]>([]);
  const [activeId, setActiveId] = createSignal("");

  // Re-extract headings whenever content changes (reactive via props.content)
  createEffect(() => {
    void props.content;
    const el = props.contentEl;
    if (!el) return;
    // Delay slightly so innerHTML has been applied
    requestAnimationFrame(() => extractHeadings(el));
  });

  function extractHeadings(el: HTMLElement) {
    const headings = el.querySelectorAll("h1, h2, h3, h4");
    const items: TocEntry[] = [];
    headings.forEach((h) => {
      if (h.id && h.textContent) {
        items.push({
          id: h.id,
          text: h.textContent.trim(),
          level: parseInt(h.tagName[1]),
        });
      }
    });
    setEntries(items);
  }

  const headingEls = createMemo(() =>
    entries()
      .map((e) => document.getElementById(e.id))
      .filter((h): h is HTMLElement => h !== null),
  );

  createEffect(() => {
    const el = props.contentEl?.closest(".overflow-y-auto");
    if (!el || entries().length === 0) return;

    let ticking = false;
    const handleScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const els = headingEls();
        for (let i = els.length - 1; i >= 0; i--) {
          if (els[i].getBoundingClientRect().top <= 100) {
            setActiveId(entries()[i].id);
            ticking = false;
            return;
          }
        }
        if (entries().length > 0) {
          setActiveId(entries()[0].id);
        }
        ticking = false;
      });
    };

    el.addEventListener("scroll", handleScroll);
    onCleanup(() => el.removeEventListener("scroll", handleScroll));
  });

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const minLevel = () => Math.min(...entries().map((e) => e.level));

  return (
    <Show when={entries().length > 0}>
      <div class="border-l" style={{ width: "200px", "min-width": "200px", "border-color": "var(--border)" }}>
        <div class="sticky top-0 max-h-full overflow-y-auto p-3">
          <h3 class="mb-2 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--muted-foreground)" }}>
            Contents
          </h3>
          <nav>
            <For each={entries()}>
              {(entry) => (
                <button
                  onClick={() => scrollTo(entry.id)}
                  class="block w-full truncate rounded px-2 py-0.5 text-left text-[11px] transition-colors"
                  style={{
                    color: activeId() === entry.id ? "var(--primary)" : "var(--muted-foreground)",
                    "font-weight": activeId() === entry.id ? "500" : "normal",
                    "padding-left": `${(entry.level - minLevel()) * 12 + 8}px`,
                  }}
                  onMouseEnter={(e) => { if (activeId() !== entry.id) e.currentTarget.style.color = "var(--foreground)"; }}
                  onMouseLeave={(e) => { if (activeId() !== entry.id) e.currentTarget.style.color = "var(--muted-foreground)"; }}
                >
                  {entry.text}
                </button>
              )}
            </For>
          </nav>
        </div>
      </div>
    </Show>
  );
}
