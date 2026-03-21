# Changelog

## [1.0.0] - 2026-03-21

### Added
- **Config Panel UI** — 3-column layout with Common, Bundle, and Preview columns
- **Multi-bundle selection** — JavaScript, Python, Java, Flutter, Rust, Go
- **Install/Uninstall management** — per-extension and bulk actions with status detection
- **Export/Import/Sync** — save to JSON, load from file, sync from URL (GitHub raw)
- **Schema validation** — validates imported/synced configs with error reporting
- **Activity Bar icon** — sidebar entry with quick action welcome view
- **Dirty state indicator** — Export button pulses yellow when config has unsaved changes
- **Smart buttons** — ✓ All, ✗ None, ↺ Reset per section and per column
- **Collapsible extension details** — version badge, marketplace link, View in VS Code
- **Date-stamped exports** — default filename includes `npack-YYYY-MM-DD.json`

### Changed
- Bumped version from 0.1.0 to 1.0.0
- Updated description to reflect full feature set
- Replaced `prompt()` with `vscode.window.showInputBox` for Sync from URL