import { createSignal, createEffect, on } from "solid-js";
import { readDir, readTextFile, watch } from "@tauri-apps/plugin-fs";
import type { Ignore } from "ignore";
import { selectedProjectId, projects } from "./projects";
import { showHidden, showGitignored } from "./file-filters";
import { loadGitignoreRules, isIgnored } from "../lib/gitignore";

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

interface TreeOptions {
  showHidden: boolean;
  gitignore: Ignore | null;
}

async function buildTree(dirPath: string, basePath: string, opts: TreeOptions): Promise<FileNode[]> {
  const entries = await readDir(dirPath);
  const nodes: FileNode[] = [];
  const pending: Promise<void>[] = [];

  for (const entry of entries) {
    if (!opts.showHidden && entry.name.startsWith(".")) continue;

    const fullPath = `${dirPath}/${entry.name}`;
    const relativePath = fullPath.slice(basePath.length + 1);

    if (opts.gitignore && isIgnored(opts.gitignore, relativePath, entry.isDirectory)) continue;

    if (entry.isDirectory) {
      pending.push(
        buildTree(fullPath, basePath, opts)
          .then((children) => {
            if (children.length > 0) {
              nodes.push({ id: relativePath, name: entry.name, path: fullPath, type: "directory", children });
            }
          })
          .catch(() => {}),
      );
    } else if (entry.isFile && isMarkdownFile(entry.name)) {
      nodes.push({ id: relativePath, name: entry.name, path: fullPath, type: "file" });
    }
  }

  await Promise.all(pending);
  return sortNodes(nodes);
}

const [fileTree, setFileTree] = createSignal<FileNode[]>([]);
const [selectedFile, setSelectedFile] = createSignal<FileNode | null>(null);
const [fileContent, setFileContent] = createSignal<string | null>(null);

// Expansion state: tracks collapsed folder IDs (default = all expanded)
const [collapsedFolders, setCollapsedFolders] = createSignal<Set<string>>(new Set());

export function isFolderExpanded(id: string): boolean {
  return !collapsedFolders().has(id);
}

export function toggleFolder(id: string) {
  setCollapsedFolders((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  });
}

function collectFolderIds(node: FileNode): string[] {
  const ids: string[] = [];
  if (node.type === "directory") {
    ids.push(node.id);
    node.children?.forEach((child) => ids.push(...collectFolderIds(child)));
  }
  return ids;
}

export function expandAll(node: FileNode) {
  const ids = collectFolderIds(node);
  setCollapsedFolders((prev) => {
    const next = new Set(prev);
    for (const id of ids) next.delete(id);
    return next;
  });
}

export function foldAll(node: FileNode) {
  const ids = collectFolderIds(node);
  setCollapsedFolders((prev) => {
    const next = new Set(prev);
    for (const id of ids) next.add(id);
    return next;
  });
}

export function expandAllRoot() {
  setCollapsedFolders(new Set<string>());
}

export function foldAllRoot() {
  const ids: string[] = [];
  for (const node of fileTree()) ids.push(...collectFolderIds(node));
  setCollapsedFolders(new Set(ids));
}

let unwatchFn: (() => void) | null = null;
let watcherDebounce: ReturnType<typeof setTimeout> | null = null;

async function loadFileTree(projectPath: string) {
  try {
    const hidden = showHidden();
    const gitignored = showGitignored();
    const gitignore = gitignored ? null : await loadGitignoreRules(projectPath);
    const tree = await buildTree(projectPath, projectPath, { showHidden: hidden, gitignore });
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
  showHidden();
  showGitignored();

  if (!projectId) { setFileTree([]); return; }
  const project = projects().find((p) => p.id === projectId);
  if (!project) { setFileTree([]); return; }

  loadFileTree(project.path);
});

createEffect(on(selectedProjectId, (projectId) => {
  setSelectedFile(null);
  setFileContent(null);
  setCollapsedFolders(new Set<string>());

  if (!projectId) return;
  const project = projects().find((p) => p.id === projectId);
  if (!project) return;

  setupWatcher(project.path);
}));

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
