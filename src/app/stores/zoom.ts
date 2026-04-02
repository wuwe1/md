import { createSignal, createEffect } from "solid-js";

const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const DEFAULT_FONT_SIZE = 16;
const STEP = 1;

const [fontSize, setFontSize] = createSignal(DEFAULT_FONT_SIZE);

createEffect(() => {
  document.documentElement.style.setProperty("--font-size", `${fontSize()}px`);
});

export function zoomIn() {
  setFontSize((s) => Math.min(s + STEP, MAX_FONT_SIZE));
}

export function zoomOut() {
  setFontSize((s) => Math.max(s - STEP, MIN_FONT_SIZE));
}

export function zoomReset() {
  setFontSize(DEFAULT_FONT_SIZE);
}

export { fontSize };
