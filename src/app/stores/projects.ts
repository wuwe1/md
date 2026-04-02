import { createSignal } from "solid-js";
import { readJsonFile, writeJsonFile } from "../lib/persistence";

export interface Project {
  id: string;
  name: string;
  path: string;
  color: string;
  addedAt: string;
}

const PROJECT_COLORS = [
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#84cc16",
];

const [projects, setProjects] = createSignal<Project[]>([]);
const [selectedProjectId, setSelectedProjectId] = createSignal<string | null>(
  null,
);

export async function loadProjects() {
  try {
    const data = await readJsonFile<Project[]>("projects.json", []);
    setProjects(data);
    if (data.length > 0 && !selectedProjectId()) {
      setSelectedProjectId(data[0].id);
    }
  } catch (e) {
    console.error("Failed to load projects:", e);
  }
}

async function saveProjects() {
  try {
    await writeJsonFile("projects.json", projects());
  } catch (e) {
    console.error("Failed to save projects:", e);
  }
}

function nextColor(): string {
  const used = new Set(projects().map((p) => p.color));
  return PROJECT_COLORS.find((c) => !used.has(c)) ?? PROJECT_COLORS[
    projects().length % PROJECT_COLORS.length
  ];
}

export async function addProject(folderPath: string) {
  const name = folderPath.split("/").pop() ?? folderPath;
  const existing = projects().find((p) => p.path === folderPath);
  if (existing) {
    setSelectedProjectId(existing.id);
    return;
  }
  const project: Project = {
    id: crypto.randomUUID(),
    name,
    path: folderPath,
    color: nextColor(),
    addedAt: new Date().toISOString(),
  };
  setProjects([...projects(), project]);
  setSelectedProjectId(project.id);
  await saveProjects();
}

export async function removeProject(id: string) {
  setProjects(projects().filter((p) => p.id !== id));
  if (selectedProjectId() === id) {
    setSelectedProjectId(projects()[0]?.id ?? null);
  }
  await saveProjects();
}

export function selectProject(id: string) {
  setSelectedProjectId(id);
}

export { projects, selectedProjectId };
