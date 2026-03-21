# AGENTS.md — NDE Hub (npack)

## Project Overview

**npack** is an all-in-one developer hub for VS Code (and forks like Antigravity, Cursor, Windsurf). It manages curated extension bundles, provides AI chat integration, and has a tab-based UI for upcoming features (Agent Config, MCP Servers, Skills, RAG Context, LLM Servers).

## Architecture

```
src/
├── extension.ts       # Entry point — commands, sidebar WebviewViewProvider
├── configPanel.ts     # Main webview panel (HTML/CSS/JS inline, message handlers)
├── packs.ts           # Extension pack definitions (bundles, sections, extensions)
├── defaultSettings.ts # VS Code settings applied on activation
└── util.ts            # First-time activation, reset helpers
```

### Sidebar (WebviewView)

`extension.ts` registers a `WebviewViewProvider` for the Activity Bar sidebar:
- **Horizontal tabs**: General (active) + planned tabs (Agent, MCP, Skills, RAG, LLM) with "soon" badges
- **General tab**: 2×2 action card grid (Bundle Config, Installed, Reset Config) + Quick Chat section
- **Quick Chat**: Provider dropdown (Auto/Antigravity/VS Code/Cursor/Windsurf) + Open Chat & Quick Ping buttons
- **Planned tabs**: Show feature description + "Coming Soon" badge

Communication via `postMessage`:
- `{ command: "open", id: "bundles"|"installed"|"reset" }` → execute VS Code commands
- `{ command: "chatOpen"|"chatPing", provider: string, text?: string }` → dynamic chat command discovery

### Config Panel (WebviewPanel)

`configPanel.ts` contains the full config panel:
- **Extension host handlers** (lines ~70–300) — switch/case on webview messages
- **HTML renderer** (`getWebviewContent()`) — generates the full HTML document
- **CSS** — embedded in `<style>` block within the HTML
- **Client JS** — embedded in `<script>` block within the HTML
- **Tab bar** — Bundle Config (active) + disabled tabs for planned features

All communication is via `postMessage` between webview ↔ extension host.

### State Management

- `globalState.get/update("npack.selectedPacks")` — array of pack IDs
- `globalState.get/update("npack.uncheckedExtensions")` — array of unchecked extension IDs
- `vscode.extensions.all` — runtime detection of installed extensions
- Dirty state tracked in webview JS (not persisted)

## Message Protocol (configPanel webview → extension host)

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

## Message Protocol (extension host → configPanel webview)

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

## Adding a Planned Feature Tab

1. Add tab data in `extension.ts` → `getSidebarHtml()` → `tabs` array (set `active: true` when ready)
2. Add tab in `configPanel.ts` → tab-bar HTML (remove `disabled` attribute when ready)
3. Wire up the message handler in `extension.ts` → `resolveWebviewView`
4. Create the feature's panel content (HTML/CSS/JS)

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
