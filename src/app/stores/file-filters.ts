import { createSignal } from "solid-js";
import { readJsonFile, writeJsonFile } from "../lib/persistence";

const [showHidden, setShowHidden] = createSignal(false);
const [showGitignored, setShowGitignored] = createSignal(false);

export async function initFileFilters() {
  const settings = await readJsonFile<Record<string, unknown>>("settings.json", {});
  if (typeof settings.showHidden === "boolean") setShowHidden(settings.showHidden);
  if (typeof settings.showGitignored === "boolean") setShowGitignored(settings.showGitignored);
}

async function persist(key: string, value: boolean) {
  const settings = await readJsonFile<Record<string, unknown>>("settings.json", {});
  settings[key] = value;
  await writeJsonFile("settings.json", settings);
}

export function toggleShowHidden() {
  const next = !showHidden();
  setShowHidden(next);
  persist("showHidden", next);
}

export function toggleShowGitignored() {
  const next = !showGitignored();
  setShowGitignored(next);
  persist("showGitignored", next);
}

export { showHidden, showGitignored };
