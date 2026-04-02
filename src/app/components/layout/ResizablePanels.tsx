import { createSignal, Show, type JSX } from "solid-js";

interface PanelConfig {
  default: number;
  min: number;
  max: number;
  content: () => JSX.Element;
  visible?: boolean;
}

interface ResizablePanelsProps {
  panels: [PanelConfig, PanelConfig, PanelConfig];
}

export function ResizablePanels(props: ResizablePanelsProps) {
  let containerRef: HTMLDivElement | undefined;

  const [savedSizes, setSavedSizes] = createSignal([
    props.panels[0].default,
    props.panels[1].default,
    props.panels[2].default,
  ]);
  const [dragging, setDragging] = createSignal<0 | 1 | null>(null);

  const visible = () => [
    props.panels[0].visible !== false,
    props.panels[1].visible !== false,
    props.panels[2].visible !== false,
  ];

  const sizes = () => {
    const v = visible();
    const s = savedSizes();
    if (v[0] && v[1] && v[2]) return s;

    const result = [0, 0, 0];
    let total = 0;
    for (let i = 0; i < 3; i++) {
      if (v[i]) {
        result[i] = s[i];
        total += s[i];
      }
    }
    if (total > 0) {
      const scale = 100 / total;
      for (let i = 0; i < 3; i++) {
        if (v[i]) result[i] *= scale;
      }
    }
    return result;
  };

  const clamp = (newSizes: number[]): number[] => {
    const result = [...newSizes];
    const v = visible();
    for (let i = 0; i < 3; i++) {
      if (!v[i]) { result[i] = 0; continue; }
      result[i] = Math.max(props.panels[i].min, Math.min(props.panels[i].max, result[i]));
    }
    const total = result.reduce((a, b) => a + b, 0);
    if (total > 0 && Math.abs(total - 100) > 0.01) {
      const scale = 100 / total;
      for (let i = 0; i < 3; i++) result[i] *= scale;
    }
    return result;
  };

  const onPointerMove = (e: PointerEvent) => {
    const d = dragging();
    if (d === null || !containerRef) return;

    const rect = containerRef.getBoundingClientRect();
    const pct = ((e.clientX - rect.left) / rect.width) * 100;
    const current = [...savedSizes()];

    if (d === 0) {
      const delta = pct - current[0];
      current[0] += delta;
      current[1] -= delta;
    } else {
      const boundary = current[0] + current[1];
      const delta = pct - boundary;
      current[1] += delta;
      current[2] -= delta;
    }

    setSavedSizes(clamp(current));
  };

  const onPointerUp = () => {
    setDragging(null);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };

  const onPointerDown = (handleIndex: 0 | 1, e: PointerEvent) => {
    e.preventDefault();
    setDragging(handleIndex);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  const handleStyle = "h-full w-px shrink-0 cursor-col-resize transition-colors";

  return (
    <div
      ref={containerRef}
      class="flex size-full"
      classList={{ "select-none": dragging() !== null }}
    >
      <Show when={visible()[0]}>
        <div style={{ width: `${sizes()[0]}%` }} class="h-full overflow-hidden">
          {props.panels[0].content()}
        </div>
        <Show when={visible()[1] || visible()[2]}>
          <div
            class={handleStyle}
            style={{ background: dragging() === 0 ? "var(--ring)" : "var(--border)" }}
            onPointerDown={(e) => onPointerDown(0, e)}
          />
        </Show>
      </Show>

      <Show when={visible()[1]}>
        <div style={{ width: `${sizes()[1]}%` }} class="h-full overflow-hidden">
          {props.panels[1].content()}
        </div>
        <Show when={visible()[2]}>
          <div
            class={handleStyle}
            style={{ background: dragging() === 1 ? "var(--ring)" : "var(--border)" }}
            onPointerDown={(e) => onPointerDown(1, e)}
          />
        </Show>
      </Show>

      <Show when={visible()[2]}>
        <div style={{ width: `${sizes()[2]}%` }} class="h-full overflow-hidden">
          {props.panels[2].content()}
        </div>
      </Show>
    </div>
  );
}
