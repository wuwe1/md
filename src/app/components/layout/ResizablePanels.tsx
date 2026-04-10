import { createSignal, type JSX } from "solid-js";

interface PanelConfig {
  default: number;
  min: number;
  max: number;
  content: () => JSX.Element;
}

interface ResizablePanelsProps {
  panels: [PanelConfig, PanelConfig];
}

export function ResizablePanels(props: ResizablePanelsProps) {
  let containerRef: HTMLDivElement | undefined;
  const [leftSize, setLeftSize] = createSignal(props.panels[0].default);
  const [dragging, setDragging] = createSignal(false);

  const onPointerMove = (e: PointerEvent) => {
    if (!dragging() || !containerRef) return;
    const rect = containerRef.getBoundingClientRect();
    let pct = ((e.clientX - rect.left) / rect.width) * 100;
    pct = Math.max(props.panels[0].min, Math.min(props.panels[0].max, pct));
    const right = 100 - pct;
    if (right < props.panels[1].min || right > props.panels[1].max) return;
    setLeftSize(pct);
  };

  const onPointerUp = () => {
    setDragging(false);
    document.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerup", onPointerUp);
  };

  const onPointerDown = (e: PointerEvent) => {
    e.preventDefault();
    setDragging(true);
    document.addEventListener("pointermove", onPointerMove);
    document.addEventListener("pointerup", onPointerUp);
  };

  return (
    <div ref={containerRef} class="flex size-full" classList={{ "select-none": dragging() }}>
      <div style={{ width: `${leftSize()}%` }} class="h-full overflow-hidden">
        {props.panels[0].content()}
      </div>
      <div
        class="h-full w-px shrink-0 cursor-col-resize transition-colors"
        style={{ background: dragging() ? "var(--ring)" : "var(--border)" }}
        onPointerDown={onPointerDown}
      />
      <div style={{ width: `${100 - leftSize()}%` }} class="h-full overflow-hidden">
        {props.panels[1].content()}
      </div>
    </div>
  );
}
