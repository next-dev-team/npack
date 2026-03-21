# NDE Hub ⚡

> All-in-one developer hub for VS Code — manage extension bundles, AI chat integration, and upcoming agent/MCP/skills/RAG/LLM tools in a single panel.

## Features

### ⚡ General Dashboard (Sidebar)

Open from the **Activity Bar** (sidebar icon). Horizontal tabs with quick actions:

- **📦 Bundle Config** — Open the full config panel
- **📋 Installed** — View all installed extensions in VS Code
- **🔄 Reset Config** — Reset to defaults
- **💬 Quick Chat** — AI provider selector (Antigravity, VS Code/Copilot, Cursor, Windsurf) with Open Chat & Quick Ping

### 📦 Bundle Config Panel

Open from sidebar or Command Palette → `Configure NDE Hub Bundles`.

- **Multi-bundle selection** — JavaScript, Python, Java, Flutter, Rust, Go
- **3-column layout** — Common Extensions | Bundle Extensions | Final Preview
- **Per-extension controls** — Install, Uninstall, View in VS Code, Marketplace link
- **Install status detection** — Green ✓ for installed, ○ for missing
- **Bulk actions** — ✓ All, ✗ None, ↺ Reset per section and per column
- **Install / Uninstall All Checked** — with progress notification
- **Collapsible details** — version badge, extension ID, description
- **Tab bar** — Bundle Config (active) + coming soon tabs (Agent, MCP, Skills, RAG, LLM)

### 📤 Export / 📥 Import / 🌐 Sync

- **Export** to `npack-YYYY-MM-DD.json` with full extension map
- **Import** from local `.json` file with schema validation
- **Sync from URL** — paste a GitHub or raw URL to load a shared config
- **Dirty indicator** — Export button pulses yellow when config has unsaved changes

### 🔧 Config Schema (`npack.json`)

```json
{
  "version": 1,
  "selectedPacks": ["javascript"],
  "uncheckedExtensions": ["Codeium.codeium"],
  "extensions": {
    "common": ["esbenp.prettier-vscode", "..."],
    "javascript": ["dbaeumer.vscode-eslint", "..."]
  },
  "exportedAt": "2026-03-21T00:00:00.000Z"
}
```

### Available Commands

- `Configure NDE Hub Bundles` — opens the config panel
- `Reset NDE Hub Config` — clears saved state
- `Show Installed Extensions` — opens VS Code extensions filtered to installed

> Press `Ctrl+Shift+P` to open the Command Palette.

## Extension Bundles

| Bundle       | Includes                                          |
| ------------ | ------------------------------------------------- |
| **Common** (shared) | Theme, Icons, Font, Formatter, AI, Git, Tools |
| **JavaScript** | ESLint, Tailwind CSS, npm IntelliSense, Auto Import |
| **Python** | Python, Pylance, Black, Jupyter |
| **Java** | Java Extension Pack, Spring Boot, Maven, Gradle |
| **Flutter** | Flutter, Dart, Bloc, Pubspec Assist |
| **Rust** | rust-analyzer, crates, TOML, CodeLLDB |
| **Go** | Go, Go Test Explorer, Protocol Buffers |

## Install

### From VSIX (local)

Download from [Releases](https://github.com/next-dev-team/npack/releases), then:

Extensions sidebar → `⋯` menu → **Install from VSIX...**

### From Source

```bash
pnpm install
pnpm run compile
# Then press F5 to launch Extension Development Host
```

## Development

```bash
pnpm run watch    # compile on save
pnpm run lint     # biome check
pnpm run format   # biome format
```

## Roadmap

### ✅ v1.0 — Done

- [x] Multi-bundle config panel with 3-column layout
- [x] Install / Uninstall management with status detection
- [x] Export / Import / Sync from URL
- [x] Schema validation for config files
- [x] Activity Bar sidebar with webview tabs
- [x] Dirty state indicator on Export button
- [x] Quick Chat integration with multi-provider support
- [x] Config panel tab bar with coming soon feature previews

### 🚧 Coming Soon — Integrated Tabs

These features appear as disabled tabs in both the sidebar and config panel, ready for future development:

#### 🤖 Agent Config

- [ ] AI agent configuration UI (system prompts, model selection, temperature)
- [ ] Per-project agent profiles with import/export
- [ ] Agent rules editor (AGENTS.md / .cursorrules / .claude)

#### 🔌 MCP Server Management

- [ ] Discover, install, and configure MCP servers
- [ ] Visual MCP server status dashboard
- [ ] Per-project MCP server profiles

#### 🧩 Skills Management

- [ ] Browse and install agent skills (SKILL.md)
- [ ] Skill marketplace with search and categories
- [ ] Custom skill authoring wizard

#### 📚 Context (RAG)

- [ ] RAG-powered codebase context (embeddings + vector search)
- [ ] Knowledge item browser and editor
- [ ] Conversation history search and retrieval
- [ ] Context window optimization (token budget management)

#### 🧠 LLM Server Management

- [ ] Local AI server management (Ollama, llama.cpp, LM Studio)
- [ ] API key vault (OpenAI, Anthropic, Google, Mistral)
- [ ] Model switcher with cost/performance comparison
- [ ] Unified inference proxy for local + cloud models

## Tips

- **Tailwind CSS IntelliSense** — configure `classRegex` in VS Code settings for full support. See [settings example](.vscode/settings.json).
- **FiraCode Font** — after installing, you may need to manually install the font files and restart VS Code.

## Feedback

[Issues & Feature Requests](https://github.com/next-dev-team/npack/issues)

## Credits

Template based on [tpack](https://github.com/SeyyedKhandon/tpack) by SeyyedKhandon.
