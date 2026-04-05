import { createSignal } from "solid-js";
import { readJsonFile, writeJsonFile } from "../lib/persistence";

export type ThemeName = "light" | "dark";

const THEME_NAMES = new Set<string>(["light", "dark"]);
const DEFAULT_THEME: ThemeName = "light";

const MIGRATION: Record<string, ThemeName> = {
  "github-light": "light",
  "catppuccin-dark": "dark",
  "gruvbox-dark": "dark",
};

const [currentTheme, setCurrentTheme] = createSignal<ThemeName>(DEFAULT_THEME);

function applyTheme(theme: ThemeName) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme !== "light");
}

export function initTheme() {
  applyTheme(DEFAULT_THEME);

  readJsonFile<Record<string, string>>("settings.json", {}).then((settings) => {
    let saved = settings.theme;
    if (saved && saved in MIGRATION) {
      saved = MIGRATION[saved];
      settings.theme = saved;
      writeJsonFile("settings.json", settings);
    }
    if (saved && THEME_NAMES.has(saved)) {
      setCurrentTheme(saved as ThemeName);
      applyTheme(saved as ThemeName);
    }
  });
}

export async function setTheme(theme: ThemeName) {
  setCurrentTheme(theme);
  applyTheme(theme);
  const settings = await readJsonFile<Record<string, string>>("settings.json", {});
  settings.theme = theme;
  await writeJsonFile("settings.json", settings);
}

export { currentTheme };
