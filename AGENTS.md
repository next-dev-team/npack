# AGENTS.md — NextDev Pack (npack)

## Project Overview

**npack** is a VS Code extension that manages curated developer extension packs with a visual webview UI. It is NOT a simple extension pack — it has a full config panel for selecting bundles, managing installs, and syncing configs.

## Architecture

```
src/
├── extension.ts      # Entry point — registers commands, TreeDataProvider
├── configPanel.ts    # Main webview panel (HTML/CSS/JS inline, message handlers)
├── packs.ts          # Extension pack definitions (bundles, sections, extensions)
├── defaultSettings.ts # VS Code settings applied on activation
└── util.ts           # First-time activation, reset helpers
```

### Key Pattern: Single-File Webview

`configPanel.ts` contains everything for the config panel:
- **Extension host handlers** (lines ~70–300) — switch/case on webview messages
- **HTML renderer** (`getWebviewContent()`) — generates the full HTML document
- **CSS** — embedded in `<style>` block within the HTML
- **Client JS** — embedded in `<script>` block within the HTML

All communication is via `postMessage` between webview ↔ extension host.

### State Management

- `globalState.get/update("npack.selectedPacks")` — array of pack IDs
- `globalState.get/update("npack.uncheckedExtensions")` — array of unchecked extension IDs
- `vscode.extensions.all` — runtime detection of installed extensions
- Dirty state tracked in webview JS (not persisted)

## Message Protocol (webview → extension host)

| Command | Payload | Description |
|---------|---------|-------------|
| `savePacks` | `packIds, uncheckedExtensions` | Persist selections |
| `refresh` | `packIds, uncheckedExtensions` | Re-render panel with new bundles |
| `installExtension` | `extensionId` | Install single extension |
| `uninstallExtension` | `extensionId` | Uninstall single extension |
| `installAll` | `extensionIds[]` | Bulk install checked |
| `uninstallAll` | `extensionIds[]` | Bulk uninstall checked (installed only) |
| `exportConfig` | `packIds, uncheckedExtensions` | Save to .json file |
| `importConfig` | — | Open file picker, load .json |
| `askSyncUrl` | — | Show input box for URL |
| `viewExtension` | `extensionId` | Open extension in VS Code sidebar |

## Message Protocol (extension host → webview)

| Command | Payload | Description |
|---------|---------|-------------|
| `installComplete` | — | Re-enable Install All button |
| `uninstallComplete` | — | Re-enable Uninstall All button |
| `extensionInstalled` | `extensionId` | Swap Install → Installed+Uninstall |
| `extensionUninstalled` | `extensionId` | Swap Installed → Install |

## Adding a New Pack

Edit `src/packs.ts`:

1. Add a new `Pack` object to the `packs` array
2. Define sections with `group`, `label`, and `extensions[]`
3. Each extension needs `id` (marketplace ID), `label`, and optional `description`
4. Set `defaultChecked: false` for extensions that should be opt-in
5. Add the pack ID to `validPackIds` in `configPanel.ts` (auto-derived from packs)

## Config Schema (npack.json)

Validated by `validateNpackConfig()` in `configPanel.ts`:
- `version` — number (currently 1)
- `selectedPacks` — non-empty string array, must match known pack IDs
- `uncheckedExtensions` — optional string array
- `extensions` — optional map of pack ID → extension ID array
- `exportedAt` — optional ISO date string

## Build & Run

```bash
pnpm install          # install deps
pnpm run watch        # compile TypeScript on save
# Press F5 in VS Code to launch Extension Development Host
```

## Linting

Uses **Biome** (not ESLint). The root ESLint config is from the parent monorepo and does not include npack in its tsconfig — those ESLint errors are expected and harmless.

```bash
pnpm run lint         # biome check src
pnpm run format       # biome format --write src
```
