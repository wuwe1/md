import { createSignal, createEffect } from "solid-js";
import { readDir, readTextFile, watch } from "@tauri-apps/plugin-fs";
import { selectedProjectId, projects } from "./projects";

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: "file" | "directory";
  children?: FileNode[];
}

const MD_EXTENSIONS = new Set([".md", ".markdown", ".mdx"]);

function isMarkdownFile(name: string): boolean {
  const lower = name.toLowerCase();
  return MD_EXTENSIONS.has(lower.slice(lower.lastIndexOf(".")));
}

function sortNodes(nodes: FileNode[]): FileNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) return a.type === "directory" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

async function buildTree(dirPath: string, basePath: string): Promise<FileNode[]> {
  const entries = await readDir(dirPath);
  const nodes: FileNode[] = [];
  const pending: Promise<void>[] = [];

  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;

    const fullPath = `${dirPath}/${entry.name}`;
    const id = fullPath.slice(basePath.length + 1);

    if (entry.isDirectory) {
      pending.push(
        buildTree(fullPath, basePath).then((children) => {
          if (children.length > 0) {
            nodes.push({ id, name: entry.name, path: fullPath, type: "directory", children });
          }
        }),
      );
    } else if (entry.isFile && isMarkdownFile(entry.name)) {
      nodes.push({ id, name: entry.name, path: fullPath, type: "file" });
    }
  }

  await Promise.all(pending);
  return sortNodes(nodes);
}

const [fileTree, setFileTree] = createSignal<FileNode[]>([]);
const [selectedFile, setSelectedFile] = createSignal<FileNode | null>(null);
const [fileContent, setFileContent] = createSignal<string | null>(null);

let unwatchFn: (() => void) | null = null;
let watcherDebounce: ReturnType<typeof setTimeout> | null = null;

async function loadFileTree(projectPath: string) {
  try {
    const tree = await buildTree(projectPath, projectPath);
    setFileTree(tree);
  } catch {
    setFileTree([]);
  }
}

async function setupWatcher(projectPath: string) {
  if (unwatchFn) {
    unwatchFn();
    unwatchFn = null;
  }
  try {
    const unwatch = await watch(projectPath, () => {
      if (watcherDebounce) clearTimeout(watcherDebounce);
      watcherDebounce = setTimeout(() => loadFileTree(projectPath), 300);
    }, { recursive: true, delayMs: 500 });
    unwatchFn = () => unwatch();
  } catch {
    // watch not available
  }
}

createEffect(() => {
  const projectId = selectedProjectId();
  setSelectedFile(null);
  setFileContent(null);

  if (!projectId) {
    setFileTree([]);
    return;
  }

  const project = projects().find((p) => p.id === projectId);
  if (!project) {
    setFileTree([]);
    return;
  }

  loadFileTree(project.path);
  setupWatcher(project.path);
});

export async function selectFile(node: FileNode) {
  if (node.type !== "file") return;
  setSelectedFile(node);
  try {
    const content = await readTextFile(node.path);
    setFileContent(content);
  } catch {
    setFileContent(null);
  }
}

export { fileTree, selectedFile, fileContent };
