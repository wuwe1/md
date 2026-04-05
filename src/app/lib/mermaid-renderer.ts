import { renderMermaidSVG } from "beautiful-mermaid";
import type { DiagramColors } from "beautiful-mermaid";
import type { ThemeName } from "../stores/theme";

const THEME_MAP: Record<ThemeName, DiagramColors> = {
  light: {
    bg: "#FAF9F5",
    fg: "#1A1917",
    line: "#D9D5CC",
    accent: "#AE5630",
    muted: "#8D877D",
    surface: "#F0EEE6",
    border: "#D9D5CC",
  },
  dark: {
    bg: "#2B2A27",
    fg: "#EAE7DF",
    line: "#4A4843",
    accent: "#D4967E",
    muted: "#A9A39A",
    surface: "#393937",
    border: "#4A4843",
  },
};

export function renderMermaidBlocks(container: HTMLElement, theme: ThemeName) {
  const colors = THEME_MAP[theme];
  const sources = container.querySelectorAll(".mermaid-source");

  sources.forEach((el) => {
    // Already rendered — re-render with new theme using stored source
    if (el.classList.contains("mermaid-rendered")) {
      const storedSource = el.getAttribute("data-source");
      if (!storedSource) return;
      try {
        const svg = renderMermaidSVG(storedSource, { ...colors });
        const diagramDiv = el.querySelector(".mermaid-diagram");
        if (diagramDiv) diagramDiv.innerHTML = svg;
        const expandBtn = el.querySelector(".mermaid-expand-btn");
        if (expandBtn) {
          (expandBtn as HTMLElement).onclick = (e) => {
            e.stopPropagation();
            openViewer(storedSource, theme);
          };
        }
      } catch {
        // keep existing
      }
      return;
    }

    // First render — source is the text content
    const source = el.textContent?.trim();
    if (!source) return;

    try {
      const svg = renderMermaidSVG(source, { ...colors });
      el.classList.add("mermaid-rendered");
      el.setAttribute("data-source", source);
      el.textContent = "";

      const diagramDiv = document.createElement("div");
      diagramDiv.className = "mermaid-diagram";
      diagramDiv.innerHTML = svg;

      const expandBtn = document.createElement("button");
      expandBtn.className = "mermaid-expand-btn";
      expandBtn.title = "Expand";
      expandBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>`;
      expandBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        openViewer(source, theme);
      });

      el.appendChild(diagramDiv);
      el.appendChild(expandBtn);
    } catch {
      // Leave text as-is for unsupported diagram types
    }
  });
}

function openViewer(source: string, theme: ThemeName) {
  const colors = THEME_MAP[theme];
  const svg = renderMermaidSVG(source, { ...colors });

  // State
  let scale = 1;
  let tx = 0;
  let ty = 0;
  let panning = false;
  let lastX = 0;
  let lastY = 0;

  // Overlay
  const overlay = document.createElement("div");
  overlay.className = "mermaid-viewer-overlay";

  // SVG container — positioned at center initially via JS
  const svgEl = document.createElement("div");
  svgEl.className = "mermaid-viewer-svg";
  svgEl.innerHTML = svg;

  function applyTransform() {
    svgEl.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
  }

  // Center after measuring
  requestAnimationFrame(() => {
    const svgRect = svgEl.getBoundingClientRect();
    tx = (window.innerWidth - svgRect.width) / 2;
    ty = (window.innerHeight - svgRect.height) / 2;
    applyTransform();
  });

  // Wheel zoom at cursor
  overlay.addEventListener("wheel", (e) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newScale = Math.max(0.05, Math.min(20, scale * factor));
    const ratio = newScale / scale;

    // Zoom toward cursor
    tx = e.clientX - (e.clientX - tx) * ratio;
    ty = e.clientY - (e.clientY - ty) * ratio;
    scale = newScale;
    applyTransform();
  }, { passive: false });

  // Pan via pointer on overlay (not close button)
  overlay.addEventListener("pointerdown", (e) => {
    if ((e.target as HTMLElement).closest(".mermaid-viewer-close")) return;
    panning = true;
    lastX = e.clientX;
    lastY = e.clientY;
    overlay.setPointerCapture(e.pointerId);
    overlay.style.cursor = "grabbing";
  });
  overlay.addEventListener("pointermove", (e) => {
    if (!panning) return;
    tx += e.clientX - lastX;
    ty += e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    applyTransform();
  });
  overlay.addEventListener("pointerup", (e) => {
    if (!panning) return;
    panning = false;
    overlay.releasePointerCapture(e.pointerId);
    overlay.style.cursor = "grab";
  });

  // Close
  const close = () => {
    overlay.remove();
    document.removeEventListener("keydown", onKey);
  };

  const closeBtn = document.createElement("button");
  closeBtn.className = "mermaid-viewer-close";
  closeBtn.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
  closeBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
  closeBtn.addEventListener("click", close);

  const onKey = (e: KeyboardEvent) => {
    if (e.key === "Escape") close();
  };
  document.addEventListener("keydown", onKey);

  overlay.appendChild(svgEl);
  overlay.appendChild(closeBtn);
  document.body.appendChild(overlay);
}
