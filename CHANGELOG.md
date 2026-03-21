# Changelog

## [1.0.0] - 2026-03-21

### Added

- **Config Panel UI** — 3-column layout with Common, Bundle, and Preview columns
- **Multi-bundle selection** — JavaScript, Python, Java, Flutter, Rust, Go
- **Install/Uninstall management** — per-extension and bulk actions with status detection
- **Export/Import/Sync** — save to JSON, load from file, sync from URL (GitHub raw)
- **Schema validation** — validates imported/synced configs with error reporting
- **Dirty state indicator** — Export button pulses yellow when config has unsaved changes
- **Smart buttons** — ✓ All, ✗ None, ↺ Reset per section and per column
- **Collapsible extension details** — version badge, marketplace link, View in VS Code
- **Date-stamped exports** — default filename includes `npack-YYYY-MM-DD.json`
- **Sidebar webview** — horizontal tabs (General + coming soon) with action card grid
- **Quick Chat** — AI provider selector (Antigravity, VS Code, Cursor, Windsurf) with Open Chat & Quick Ping
- **Show Installed** — command to open VS Code extensions filtered to installed
- **Config panel tab bar** — Bundle Config (active) + disabled tabs for Agent, MCP, Skills, RAG, LLM
- **GitHub Actions release** — automated VSIX packaging, changelog generation, and GitHub Release on tag push
- **Agent skill** — `skills/release/SKILL.md` documenting the release workflow

### Changed

- Bumped version from 0.1.0 to 1.0.0
- Sidebar upgraded from tree view to webview with horizontal tabs
- Removed hardcoded `extensionPack` from package.json (now dynamic via `packs.ts`)
- Cleaned up unused devDependencies and scripts
- Updated README, AGENTS.md, and package.json to reflect all-in-one developer hub vision