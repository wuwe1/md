import ignore, { type Ignore } from "ignore";
import { readTextFile } from "@tauri-apps/plugin-fs";

export async function loadGitignoreRules(projectPath: string): Promise<Ignore> {
  const ig = ignore();
  ig.add(".git");
  await collectRules(projectPath, "", ig);
  return ig;
}

async function collectRules(dirPath: string, prefix: string, ig: Ignore) {
  try {
    const content = await readTextFile(`${dirPath}/.gitignore`);
    const lines = content.split("\n").filter((l) => l.trim() && !l.startsWith("#"));
    for (const line of lines) {
      if (prefix) {
        if (line.startsWith("!")) {
          ig.add(`!${prefix}${line.slice(1)}`);
        } else {
          ig.add(`${prefix}${line}`);
        }
      } else {
        ig.add(line);
      }
    }
  } catch {
    // no .gitignore in this directory
  }
}

export function isIgnored(ig: Ignore, relativePath: string, isDirectory: boolean): boolean {
  try {
    const testPath = isDirectory ? `${relativePath}/` : relativePath;
    return ig.ignores(testPath);
  } catch {
    return false;
  }
}
