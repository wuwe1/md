import { readTextFile, writeTextFile, mkdir } from "@tauri-apps/plugin-fs";
import { appDataDir } from "@tauri-apps/api/path";

let cachedDir = "";

async function getDataDir(): Promise<string> {
  if (!cachedDir) {
    cachedDir = await appDataDir();
    await mkdir(cachedDir, { recursive: true });
  }
  return cachedDir;
}

export async function readJsonFile<T>(filename: string, fallback: T): Promise<T> {
  try {
    const dir = await getDataDir();
    const content = await readTextFile(`${dir}/${filename}`);
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

export async function writeJsonFile(filename: string, data: unknown): Promise<void> {
  const dir = await getDataDir();
  await writeTextFile(`${dir}/${filename}`, JSON.stringify(data, null, 2));
}
