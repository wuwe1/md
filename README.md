# md

A lightweight, cross-platform markdown reader with a 3-column navigation layout.

Built with [Tauri 2](https://tauri.app/) + [SolidJS](https://www.solidjs.com/) + TypeScript.

## Features

- **3-column layout** — Projects / File Explorer / Content viewer
- **Syntax highlighting** — VS Code quality via [Shiki](https://shiki.style/)
- **Mermaid diagrams** — rendered with [beautiful-mermaid](https://github.com/nicegui/beautiful-mermaid), with fullscreen zoom/pan viewer
- **3 themes** — GitHub Light, Catppuccin Dark, Gruvbox Dark
- **Table of Contents** — auto-generated from headings with scroll tracking
- **Quick Open** — fuzzy file search with `Cmd+P` / `Ctrl+P`
- **File watching** — auto-refresh on file changes
- **PDF export** — via `Cmd+Shift+E`
- **Dotfiles toggle** — show/hide hidden files and directories
- **Gitignore toggle** — show/hide gitignored files
- **Expand/Fold all** — root-level buttons + right-click context menu on folders
- **Drag & drop** — drop a folder onto the window to add it as a project

## Download

Grab the latest release from the [Releases page](https://github.com/wuwe1/md/releases).

| Platform | File |
|----------|------|
| macOS (Apple Silicon) | `.dmg` (aarch64) |
| macOS (Intel) | `.dmg` (x86_64) |
| Windows | `.msi` / `.exe` |
| Linux | `.deb` / `.AppImage` |

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) 22+
- [pnpm](https://pnpm.io/) 10+
- [Rust](https://www.rust-lang.org/tools/install) (stable)
- Tauri 2 system dependencies — see [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

### Setup

```bash
pnpm install
pnpm tauri dev
```

### Build

```bash
pnpm tauri build
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Shell | Tauri 2 |
| Frontend | SolidJS |
| Styling | Tailwind CSS v4 |
| Markdown | unified / remark / rehype |
| Syntax | Shiki (dual theme) |
| Diagrams | beautiful-mermaid |

## License

MIT
