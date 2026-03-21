import * as vscode from "vscode";
import { packs, commonSections, type Pack, type PackSection } from "./packs";

let currentPanel: vscode.WebviewPanel | undefined;

interface NpackConfig {
  version: number;
  selectedPacks: string[];
  uncheckedExtensions: string[];
  extensions?: Record<string, string[]>;
  exportedAt?: string;
}

const validPackIds = new Set(packs.map((p) => p.id));

function validateNpackConfig(raw: unknown): NpackConfig {
  if (!raw || typeof raw !== "object") throw new Error("Config must be a JSON object");
  const obj = raw as Record<string, unknown>;

  // version
  if (obj.version !== undefined && typeof obj.version !== "number") {
    throw new Error("'version' must be a number");
  }

  // selectedPacks
  if (!Array.isArray(obj.selectedPacks) || obj.selectedPacks.length === 0) {
    throw new Error("'selectedPacks' must be a non-empty array");
  }
  const invalidPacks = (obj.selectedPacks as string[]).filter((id) => !validPackIds.has(id));
  if (invalidPacks.length > 0) {
    throw new Error(`Unknown pack(s): ${invalidPacks.join(", ")}. Valid: ${[...validPackIds].join(", ")}`);
  }

  // uncheckedExtensions
  if (obj.uncheckedExtensions !== undefined && !Array.isArray(obj.uncheckedExtensions)) {
    throw new Error("'uncheckedExtensions' must be an array");
  }

  return {
    version: (obj.version as number) ?? 1,
    selectedPacks: obj.selectedPacks as string[],
    uncheckedExtensions: (obj.uncheckedExtensions as string[]) ?? [],
    extensions: obj.extensions as Record<string, string[]> | undefined,
    exportedAt: obj.exportedAt as string | undefined,
  };
}

export function showConfigPanel(context: vscode.ExtensionContext) {
  if (currentPanel) {
    currentPanel.reveal(vscode.ViewColumn.One);
    return;
  }

  currentPanel = vscode.window.createWebviewPanel(
    "npackConfig",
    "NDE Hub — Configure",
    vscode.ViewColumn.One,
    { enableScripts: true, retainContextWhenHidden: true }
  );

  const savedPackIds =
    context.globalState.get<string[]>("npack.selectedPacks") ?? ["javascript"];
  const savedUnchecked =
    context.globalState.get<string[]>("npack.uncheckedExtensions") ?? [];

  const getInstalledIds = () =>
    new Set(vscode.extensions.all.map((e) => e.id.toLowerCase()));

  currentPanel.webview.html = getWebviewContent(savedPackIds, savedUnchecked, getInstalledIds());

  currentPanel.webview.onDidReceiveMessage(
    async (message) => {
      switch (message.command) {
        case "savePacks":
          await context.globalState.update(
            "npack.selectedPacks",
            message.packIds
          );
          await context.globalState.update(
            "npack.uncheckedExtensions",
            message.uncheckedExtensions
          );
          vscode.window.showInformationMessage(
            `NDE Hub: ${message.packIds.length} bundle(s) saved!`
          );
          break;
        case "installExtension":
          await vscode.commands.executeCommand(
            "workbench.extensions.installExtension",
            message.extensionId
          );
          if (currentPanel) {
            currentPanel.webview.postMessage({
              command: "extensionInstalled",
              extensionId: message.extensionId,
            });
          }
          vscode.window.showInformationMessage(
            `Installed ${message.extensionId}`
          );
          break;
        case "uninstallExtension":
          await vscode.commands.executeCommand(
            "workbench.extensions.uninstallExtension",
            message.extensionId
          );
          if (currentPanel) {
            currentPanel.webview.postMessage({
              command: "extensionUninstalled",
              extensionId: message.extensionId,
            });
          }
          vscode.window.showInformationMessage(
            `Uninstalled ${message.extensionId}`
          );
          break;
        case "viewExtension":
          // Opens the extension detail page in VS Code sidebar (shows full README)
          vscode.commands.executeCommand(
            "workbench.extensions.search",
            `@id:${message.extensionId}`
          );
          break;
        case "installAll":
          if (message.extensionIds?.length > 0) {
            const ids: string[] = message.extensionIds;
            vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "NDE Hub",
                cancellable: false,
              },
              async (progress) => {
                for (let i = 0; i < ids.length; i++) {
                  progress.report({
                    message: `Installing ${i + 1}/${ids.length}: ${ids[i]}`,
                    increment: (1 / ids.length) * 100,
                  });
                  await vscode.commands.executeCommand(
                    "workbench.extensions.installExtension",
                    ids[i]
                  );
                }
                vscode.window.showInformationMessage(
                  `NDE Hub: ${ids.length} extensions installed!`
                );
                // Notify webview to re-enable buttons
                if (currentPanel) {
                  currentPanel.webview.postMessage({ command: "installComplete" });
                }
              }
            );
          }
          break;
        case "uninstallAll":
          if (message.extensionIds?.length > 0) {
            const uids: string[] = message.extensionIds;
            vscode.window.withProgress(
              {
                location: vscode.ProgressLocation.Notification,
                title: "NDE Hub",
                cancellable: false,
              },
              async (progress) => {
                for (let i = 0; i < uids.length; i++) {
                  progress.report({
                    message: `Uninstalling ${i + 1}/${uids.length}: ${uids[i]}`,
                    increment: (1 / uids.length) * 100,
                  });
                  await vscode.commands.executeCommand(
                    "workbench.extensions.uninstallExtension",
                    uids[i]
                  );
                }
                vscode.window.showInformationMessage(
                  `NDE Hub: ${uids.length} extensions uninstalled!`
                );
                if (currentPanel) {
                  currentPanel.webview.postMessage({ command: "uninstallComplete" });
                }
              }
            );
          }
          break;
        case "refresh":
          if (currentPanel) {
            currentPanel.webview.html = getWebviewContent(
              message.packIds,
              message.uncheckedExtensions,
              getInstalledIds()
            );
          }
          break;
        case "exportConfig": {
          // Build full extensions map grouped by pack
          const extMap: Record<string, string[]> = {
            common: commonSections.flatMap((s) =>
              s.extensions.map((e) => e.id)
            ),
          };
          for (const packId of message.packIds as string[]) {
            const pack = packs.find((p) => p.id === packId);
            if (pack) {
              extMap[pack.id] = pack.sections.flatMap((s) =>
                s.extensions.map((e) => e.id)
              );
            }
          }
          const config = {
            version: 1,
            selectedPacks: message.packIds,
            uncheckedExtensions: message.uncheckedExtensions,
            extensions: extMap,
            exportedAt: new Date().toISOString(),
          };
          const now = new Date();
          const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
          const uri = await vscode.window.showSaveDialog({
            filters: { "npack Config": ["json"] },
            defaultUri: vscode.Uri.file(`npack-${stamp}.json`),
          });
          if (uri) {
            await vscode.workspace.fs.writeFile(
              uri,
              Buffer.from(JSON.stringify(config, null, 2))
            );
            vscode.window.showInformationMessage(
              `NDE Hub: Config exported to ${uri.fsPath}`
            );
          }
          break;
        }
        case "importConfig": {
          const files = await vscode.window.showOpenDialog({
            filters: { "npack Config": ["json"] },
            canSelectMany: false,
          });
          if (files?.[0]) {
            try {
              const data = await vscode.workspace.fs.readFile(files[0]);
              const raw = JSON.parse(Buffer.from(data).toString());
              const config = validateNpackConfig(raw);
              await context.globalState.update("npack.selectedPacks", config.selectedPacks);
              await context.globalState.update(
                "npack.uncheckedExtensions",
                config.uncheckedExtensions
              );
              if (currentPanel) {
                currentPanel.webview.html = getWebviewContent(
                  config.selectedPacks,
                  config.uncheckedExtensions,
                  getInstalledIds()
                );
              }
              vscode.window.showInformationMessage(
                `NDE Hub: Imported ${config.selectedPacks.length} bundle(s) from ${files[0].fsPath}`
              );
            } catch (e: any) {
              vscode.window.showErrorMessage(
                `NDE Hub: Failed to import — ${e.message}`
              );
            }
          }
          break;
        }
        case "syncFromUrl": {
          const url = message.url as string;
          if (!url) break;
          try {
            // Convert GitHub blob URLs to raw URLs
            const rawUrl = url
              .replace("github.com", "raw.githubusercontent.com")
              .replace("/blob/", "/");
            const resp = await fetch(rawUrl);
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const raw = await resp.json();
            const config = validateNpackConfig(raw);
            await context.globalState.update("npack.selectedPacks", config.selectedPacks);
            await context.globalState.update(
              "npack.uncheckedExtensions",
              config.uncheckedExtensions
            );
            if (currentPanel) {
              currentPanel.webview.html = getWebviewContent(
                config.selectedPacks,
                config.uncheckedExtensions,
                getInstalledIds()
              );
            }
            vscode.window.showInformationMessage(
              `NDE Hub: Synced ${config.selectedPacks.length} bundle(s) from URL`
            );
          } catch (e: any) {
            vscode.window.showErrorMessage(
              `NDE Hub: Sync failed — ${e.message}`
            );
          }
          break;
        }
        case "askSyncUrl": {
          const url = await vscode.window.showInputBox({
            prompt: "Paste a URL to a npack.json file (GitHub, raw URL, etc.)",
            placeHolder: "https://github.com/user/repo/blob/main/npack.json",
          });
          if (url?.trim()) {
            // Re-use syncFromUrl logic by dispatching internally
            try {
              const rawUrl = url
                .trim()
                .replace("github.com", "raw.githubusercontent.com")
                .replace("/blob/", "/");
              const resp = await fetch(rawUrl);
              if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
              const raw = await resp.json();
              const config = validateNpackConfig(raw);
              await context.globalState.update("npack.selectedPacks", config.selectedPacks);
              await context.globalState.update(
                "npack.uncheckedExtensions",
                config.uncheckedExtensions
              );
              if (currentPanel) {
                currentPanel.webview.html = getWebviewContent(
                  config.selectedPacks,
                  config.uncheckedExtensions,
                  getInstalledIds()
                );
              }
              vscode.window.showInformationMessage(
                `NDE Hub: Synced ${config.selectedPacks.length} bundle(s) from URL`
              );
            } catch (e: any) {
              vscode.window.showErrorMessage(
                `NDE Hub: Sync failed — ${e.message}`
              );
            }
          }
          break;
        }
      }
    },
    undefined,
    context.subscriptions
  );

  currentPanel.onDidDispose(() => {
    currentPanel = undefined;
  });
}

function marketplaceUrl(id: string) {
  return `https://marketplace.visualstudio.com/items?itemName=${id}`;
}

let sectionCounter = 0;

function renderSection(section: PackSection, unchecked: string[], installedIds: Set<string>): string {
  const sectionId = `sec-${sectionCounter++}`;
  const defaultIds = JSON.stringify(
    section.extensions.filter((e) => e.defaultChecked !== false).map((e) => e.id)
  );

  const items = section.extensions
    .map(
      (ext) => {
        const badgeUrl = `https://img.shields.io/visual-studio-marketplace/v/${ext.id}?style=flat-square&label=&color=0078d4`;
        const isInstalled = installedIds.has(ext.id.toLowerCase());
        const statusBadge = isInstalled
          ? '<span class="ext-status ext-status-installed">✓</span>'
          : '<span class="ext-status ext-status-missing">○</span>';
        const actionBtn = isInstalled
          ? `<span class="ext-btn-group" data-ext-id="${ext.id}">
               <button class="btn-installed" disabled>✓ Installed</button>
               <button class="btn-uninstall" data-ext-id="${ext.id}" title="Uninstall">✕</button>
             </span>`
          : `<button class="btn-install" data-ext-id="${ext.id}" title="Install">Install</button>`;
        return `
      <div class="ext-item" data-ext-id="${ext.id}">
        <div class="ext-row">
          <label class="ext-check">
            <input type="checkbox" class="ext-cb" value="${ext.id}" ${unchecked.includes(ext.id) || ext.defaultChecked === false ? "" : "checked"} />
            ${statusBadge}
            <span class="ext-label">${ext.label}</span>
          </label>
          ${actionBtn}
        </div>
        <details class="ext-details">
          <summary class="ext-summary">ℹ️ ${ext.description || "View details"}</summary>
          <div class="ext-info">
            <img class="ext-badge" src="${badgeUrl}" alt="version" />
            <span class="ext-id-badge">${ext.id}</span>
          </div>
          <div class="ext-actions">
            <button class="btn-view" data-ext-id="${ext.id}">📖 View in VS Code</button>
            <a class="ext-link" href="${marketplaceUrl(ext.id)}">🌐 Marketplace</a>
          </div>
        </details>
      </div>`;
      }
    )
    .join("");

  return `
    <div class="section" id="${sectionId}" data-defaults='${defaultIds}'>
      <div class="section-header">
        <h3 class="section-title">${section.label}</h3>
        <div class="section-actions">
          <button class="sec-btn" data-action="checkAll" data-sec="${sectionId}" title="Check all">✓ All</button>
          <button class="sec-btn" data-action="uncheckAll" data-sec="${sectionId}" title="Uncheck all">✗ None</button>
          <button class="sec-btn" data-action="resetDefault" data-sec="${sectionId}" title="Reset to default">↺ Reset</button>
        </div>
      </div>
      ${items}
    </div>`;
}

function getWebviewContent(
  selectedPackIds: string[],
  unchecked: string[],
  installedIds: Set<string>
): string {
  sectionCounter = 0;
  const selectedPacks = packs.filter((p) => selectedPackIds.includes(p.id));

  // Build bundle toggle buttons (multi-select)
  const bundleToggles = packs
    .map(
      (p) =>
        `<button class="bundle-toggle ${selectedPackIds.includes(p.id) ? "selected" : ""}" data-pack-id="${p.id}">
          <span class="tab-icon">${p.icon}</span>
          <span class="tab-label">${p.label}</span>
          ${p.isDefault ? '<span class="tab-badge">default</span>' : ""}
        </button>`
    )
    .join("");

  // Render common section
  const commonHtml = commonSections
    .map((s) => renderSection(s, unchecked, installedIds))
    .join("");

  // Render each selected pack's sections
  const packsHtml = selectedPacks
    .map(
      (pack) => `
      <div class="pack-block">
        <div class="pack-header">${pack.icon} ${pack.label}</div>
        ${pack.sections.map((s) => renderSection(s, unchecked, installedIds)).join("")}
      </div>`
    )
    .join("");

  // Build preview grouped by source
  const seenIds = new Set<string>();
  const previewGroups: { title: string; icon: string; items: { id: string; label: string }[] }[] = [];

  // Common group
  const commonItems: { id: string; label: string }[] = [];
  for (const s of commonSections) {
    for (const ext of s.extensions) {
      if (!unchecked.includes(ext.id) && ext.defaultChecked !== false && !seenIds.has(ext.id)) {
        seenIds.add(ext.id);
        commonItems.push({ id: ext.id, label: ext.label });
      }
    }
  }
  if (commonItems.length > 0) {
    previewGroups.push({ title: "Common", icon: "🎨", items: commonItems });
  }

  // Per-pack groups
  for (const pack of selectedPacks) {
    const packItems: { id: string; label: string }[] = [];
    for (const s of pack.sections) {
      for (const ext of s.extensions) {
        if (!unchecked.includes(ext.id) && ext.defaultChecked !== false && !seenIds.has(ext.id)) {
          seenIds.add(ext.id);
          packItems.push({ id: ext.id, label: ext.label });
        }
      }
    }
    if (packItems.length > 0) {
      previewGroups.push({ title: pack.label, icon: pack.icon, items: packItems });
    }
  }

  const totalCount = previewGroups.reduce((sum, g) => sum + g.items.length, 0);

  const previewHtml = previewGroups
    .map(
      (g) => `
      <div class="preview-group">
        <div class="preview-group-title">${g.icon} ${g.title} <span class="preview-group-count">(${g.items.length})</span></div>
        ${g.items.map((e) => `<div class="preview-item"><span class="preview-label">${e.label}</span></div>`).join("")}
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NDE Hub Config</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--vscode-font-family);
      font-size: var(--vscode-font-size);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      display: flex;
      flex-direction: column;
      height: 100vh;
      overflow: hidden;
    }

    /* ─── Header ─── */
    .header {
      padding: 20px 24px 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      flex-shrink: 0;
    }
    .header-top {
      display: flex; align-items: center;
      justify-content: space-between; gap: 12px;
    }
    .header-actions { display: flex; gap: 6px; }
    .header h1 { font-size: 1.4em; font-weight: 600; margin-bottom: 4px; }
    .header p { opacity: 0.7; font-size: 0.9em; }

    /* ─── Bundle Toggles (multi-select) ─── */
    .toggles {
      display: flex;
      gap: 6px;
      padding: 12px 24px;
      border-bottom: 1px solid var(--vscode-panel-border);
      flex-wrap: wrap;
    }
    .bundle-toggle {
      display: flex; align-items: center; gap: 6px;
      padding: 8px 14px;
      border: 1px solid var(--vscode-panel-border);
      border-radius: 6px;
      background: transparent;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 0.85em;
      transition: all 0.15s ease;
    }
    .bundle-toggle:hover { background: var(--vscode-list-hoverBackground); }
    .bundle-toggle.selected {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
    }
    .tab-icon { font-size: 1.1em; }
    .tab-badge {
      font-size: 0.7em; padding: 1px 5px; border-radius: 3px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      text-transform: uppercase; letter-spacing: 0.5px;
    }

    /* ─── Main Content ─── */
    .main { display: flex; max-width: 1400px; margin: 0 auto; flex: 1; overflow: hidden; width: 100%; }
    .col { flex: 1; padding: 16px 24px; min-width: 0; overflow-y: auto; }
    .col + .col { border-left: 1px solid var(--vscode-panel-border); }
    .col-title {
      font-size: 1.05em; font-weight: 600;
      margin-bottom: 12px; padding-bottom: 8px;
      border-bottom: 1px solid var(--vscode-panel-border);
      opacity: 0.85;
      display: flex; align-items: center; justify-content: space-between;
    }
    .col-actions { display: flex; gap: 4px; }
    .col-btn {
      padding: 2px 8px; border: 1px solid var(--vscode-panel-border);
      border-radius: 3px; background: transparent;
      color: var(--vscode-descriptionForeground);
      cursor: pointer; font-size: 0.72em;
      transition: all 0.15s;
    }
    .col-btn:hover {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
    }

    /* ─── Pack blocks ─── */
    .pack-block { margin-bottom: 16px; }
    .pack-header {
      font-size: 0.95em; font-weight: 600;
      padding: 6px 0 4px;
      border-bottom: 1px dashed var(--vscode-panel-border);
      margin-bottom: 8px;
    }

    /* ─── Sections ─── */
    .section { margin-bottom: 14px; }
    .section-header {
      display: flex; align-items: center;
      justify-content: space-between; gap: 6px;
      margin-bottom: 6px;
    }
    .section-title {
      font-size: 0.9em; font-weight: 600;
      color: var(--vscode-descriptionForeground);
    }
    .section-actions { display: flex; gap: 4px; }
    .sec-btn {
      padding: 1px 6px; border: none; border-radius: 3px;
      background: transparent; color: var(--vscode-descriptionForeground);
      cursor: pointer; font-size: 0.7em; opacity: 0;
      transition: opacity 0.15s, background 0.1s;
    }
    .section:hover .sec-btn { opacity: 0.7; }
    .sec-btn:hover {
      opacity: 1 !important;
      background: var(--vscode-list-hoverBackground);
    }

    /* ─── Extension Items ─── */
    .ext-item { padding: 4px 8px; border-radius: 4px; margin-bottom: 2px; transition: background 0.1s; }
    .ext-item:hover { background: var(--vscode-list-hoverBackground); }
    .ext-row { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .ext-check { display: flex; align-items: center; gap: 6px; cursor: pointer; flex: 1; min-width: 0; }
    .ext-cb { accent-color: var(--vscode-button-background); width: 15px; height: 15px; flex-shrink: 0; }
    .ext-status { font-size: 0.75em; flex-shrink: 0; }
    .ext-status-installed { color: #4ec9b0; }
    .ext-status-missing { color: var(--vscode-descriptionForeground); opacity: 0.4; }
    .ext-label { font-weight: 500; white-space: nowrap; }
    .ext-details { margin-left: 31px; margin-top: 4px; margin-bottom: 4px; }
    .ext-summary {
      font-size: 0.8em; opacity: 0.55; cursor: pointer;
      list-style: none; padding: 2px 0;
    }
    .ext-summary::-webkit-details-marker { display: none; }
    .ext-summary::before { content: "▸ "; font-size: 0.85em; }
    details[open] > .ext-summary::before { content: "▾ "; }
    .ext-info {
      display: flex; align-items: center; gap: 10px;
      padding: 6px 0 4px; flex-wrap: wrap;
    }
    .ext-badge { height: 16px; vertical-align: middle; }
    .ext-id-badge {
      font-family: var(--vscode-editor-font-family);
      font-size: 0.75em;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      padding: 2px 7px; border-radius: 3px;
    }
    .ext-actions {
      display: flex; align-items: center; gap: 8px;
      padding: 4px 0 6px;
    }
    .btn-view {
      padding: 3px 10px; border: none; border-radius: 3px;
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
      cursor: pointer; font-size: 0.78em;
      transition: background 0.1s;
    }
    .btn-view:hover {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
    }
    .ext-link {
      font-size: 0.78em;
      color: var(--vscode-textLink-foreground);
      text-decoration: none;
    }
    .ext-link:hover { text-decoration: underline; }
    .btn-install {
      padding: 3px 10px;
      border: 1px solid var(--vscode-button-secondaryBackground, #555);
      border-radius: 3px; background: transparent;
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
      cursor: pointer; font-size: 0.75em; white-space: nowrap;
      opacity: 0; transition: opacity 0.15s;
    }
    .ext-item:hover .btn-install { opacity: 1; }
    .btn-install:hover {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border-color: var(--vscode-button-background);
    }
    .ext-btn-group {
      display: flex; align-items: center; gap: 2px;
      opacity: 0; transition: opacity 0.15s;
    }
    .ext-item:hover .ext-btn-group { opacity: 1; }
    .btn-installed {
      padding: 3px 8px; border: none; border-radius: 3px 0 0 3px;
      background: rgba(78, 201, 176, 0.15); color: #4ec9b0;
      font-size: 0.72em; white-space: nowrap; cursor: default;
    }
    .btn-uninstall {
      padding: 3px 6px; border: none; border-radius: 0 3px 3px 0;
      background: transparent; color: var(--vscode-descriptionForeground);
      cursor: pointer; font-size: 0.72em;
      transition: all 0.15s;
    }
    .btn-uninstall:hover {
      background: rgba(244, 135, 113, 0.2); color: #f48771;
    }

    /* ─── Preview Column ─── */
    .preview-group { margin-bottom: 12px; }
    .preview-group-title {
      font-size: 0.9em; font-weight: 600;
      padding: 4px 0; margin-bottom: 4px;
      border-bottom: 1px dashed var(--vscode-panel-border);
      color: var(--vscode-descriptionForeground);
    }
    .preview-group-count { font-weight: 400; opacity: 0.5; font-size: 0.85em; }
    .preview-item {
      padding: 3px 0 3px 8px; font-size: 0.85em;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    .preview-label { font-weight: 500; }
    .preview-count {
      font-size: 0.85em; opacity: 0.6; margin-bottom: 10px;
    }

    /* ─── Footer ─── */
    .footer {
      padding: 12px 24px;
      border-top: 1px solid var(--vscode-panel-border);
      display: flex; align-items: center;
      justify-content: space-between; gap: 12px;
      flex-shrink: 0;
      background: var(--vscode-editor-background);
    }
    .footer-info { font-size: 0.85em; opacity: 0.6; }
    .footer-buttons { display: flex; gap: 8px; }
    .btn-save, .btn-install-all {
      padding: 8px 20px; border: none; border-radius: 4px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      cursor: pointer; font-size: 0.9em; font-weight: 500;
      transition: opacity 0.15s;
    }
    .btn-install-all {
      background: var(--vscode-button-secondaryBackground, #3a3d41);
      color: var(--vscode-button-secondaryForeground, var(--vscode-foreground));
    }
    .btn-uninstall-all {
      padding: 8px 20px; border: none; border-radius: 4px;
      background: rgba(244, 135, 113, 0.15); color: #f48771;
      cursor: pointer; font-size: 0.9em; font-weight: 500;
      transition: opacity 0.15s;
    }
    .btn-uninstall-all:hover { opacity: 0.85; }
    .btn-secondary {
      background: transparent;
      border: 1px solid var(--vscode-panel-border);
      color: var(--vscode-descriptionForeground);
    }
    .btn-secondary:hover {
      background: var(--vscode-list-hoverBackground);
      color: var(--vscode-foreground);
    }
    .btn-secondary.dirty {
      border-color: #cca700;
      color: #cca700;
      position: relative;
    }
    .btn-secondary.dirty::after {
      content: '';
      position: absolute; top: -3px; right: -3px;
      width: 8px; height: 8px;
      background: #cca700; border-radius: 50%;
      animation: pulse-dot 2s infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }
    .btn-save:hover, .btn-install-all:hover { opacity: 0.9; }

    /* ─── Tab Bar ─── */
    .tab-bar {
      display: flex; gap: 2px; padding: 0 16px;
      border-bottom: 1px solid var(--vscode-panel-border);
      background: var(--vscode-sideBar-background, transparent);
      overflow-x: auto;
    }
    .tab {
      padding: 8px 14px; border: none; background: transparent;
      color: var(--vscode-descriptionForeground);
      font-size: 0.82em; cursor: default; white-space: nowrap;
      border-bottom: 2px solid transparent;
      transition: all 0.15s;
    }
    .tab.active {
      color: var(--vscode-foreground);
      border-bottom-color: var(--vscode-button-background);
      font-weight: 600;
    }
    .tab.disabled {
      opacity: 0.4; cursor: not-allowed;
    }
    .tab-soon {
      font-size: 0.65em; padding: 1px 4px;
      background: var(--vscode-badge-background);
      color: var(--vscode-badge-foreground);
      border-radius: 3px; margin-left: 4px;
      vertical-align: middle;
    }

    @media (max-width: 900px) {
      .main { flex-direction: column; }
      .col + .col { border-left: none; border-top: 1px solid var(--vscode-panel-border); }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <h1>⚡ NDE Hub — Bundle Config</h1>
      <div class="header-actions">
        <button class="btn-secondary" id="exportBtn">📤 Export</button>
        <button class="btn-secondary" id="importBtn">📥 Import</button>
        <button class="btn-secondary" id="syncBtn">🌐 Sync from URL</button>
      </div>
    </div>
    <p>Select one or more developer bundles. Review & install extensions via the checklist.</p>
  </div>

  <div class="tab-bar">
    <button class="tab active">📦 Bundle Config</button>
    <button class="tab disabled" disabled>🤖 Agent<span class="tab-soon">soon</span></button>
    <button class="tab disabled" disabled>🔌 MCP<span class="tab-soon">soon</span></button>
    <button class="tab disabled" disabled>🧩 Skills<span class="tab-soon">soon</span></button>
    <button class="tab disabled" disabled>📚 RAG<span class="tab-soon">soon</span></button>
    <button class="tab disabled" disabled>🧠 LLM<span class="tab-soon">soon</span></button>
  </div>

  <div class="toggles">
    ${bundleToggles}
  </div>

  <div class="main">
    <!-- Left: Common -->
    <div class="col" id="col-common">
      <div class="col-title">
        🎨 Common (shared)
        <span class="col-actions">
          <button class="col-btn" data-col="col-common" data-action="all">✓ All</button>
          <button class="col-btn" data-col="col-common" data-action="none">✗ None</button>
          <button class="col-btn" data-col="col-common" data-action="reset">↺ Reset</button>
        </span>
      </div>
      ${commonHtml}
    </div>

    <!-- Middle: Selected pack extensions -->
    <div class="col" id="col-bundles">
      <div class="col-title">
        📦 Bundle Extensions
        <span class="col-actions">
          <button class="col-btn" data-col="col-bundles" data-action="all">✓ All</button>
          <button class="col-btn" data-col="col-bundles" data-action="none">✗ None</button>
          <button class="col-btn" data-col="col-bundles" data-action="reset">↺ Reset</button>
        </span>
      </div>
      ${packsHtml || '<p style="opacity:0.5;padding:8px;">Select a bundle above to see its extensions.</p>'}
    </div>

    <!-- Right: Preview -->
    <div class="col">
      <div class="col-title">📋 Final Preview</div>
      <div class="preview-count">${totalCount} extensions total</div>
      ${previewHtml || '<p style="opacity:0.5;">No extensions selected.</p>'}
    </div>
  </div>

  <div class="footer">
    <span class="footer-info" id="extCount">${totalCount} extensions selected</span>
    <div class="footer-buttons">
      <button class="btn-install-all" id="installAllBtn">📦 Install All Checked</button>
      <button class="btn-uninstall-all" id="uninstallAllBtn">🗑️ Uninstall All Checked</button>
      <button class="btn-save" id="saveBtn">💾 Save Selection</button>
    </div>
  </div>

  <script>
    const vscode = acquireVsCodeApi();

    // Track selected packs
    let selectedPacks = ${JSON.stringify(selectedPackIds)};
    const installedSet = new Set(${JSON.stringify([...installedIds])});

    // Bundle toggle (multi-select)
    document.querySelectorAll('.bundle-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        const packId = btn.dataset.packId;
        const idx = selectedPacks.indexOf(packId);
        if (idx >= 0) {
          selectedPacks.splice(idx, 1);
        } else {
          selectedPacks.push(packId);
        }
        // Gather current unchecked state
        const uc = [];
        document.querySelectorAll('.ext-cb').forEach(cb => {
          if (!cb.checked) uc.push(cb.value);
        });
        vscode.postMessage({ command: 'refresh', packIds: selectedPacks, uncheckedExtensions: uc });
      });
    });

    // Column-level All / None / Reset
    document.querySelectorAll('.col-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const col = document.getElementById(btn.dataset.col);
        if (!col) return;
        const action = btn.dataset.action;
        if (action === 'all' || action === 'none') {
          const checked = action === 'all';
          col.querySelectorAll('.ext-cb').forEach(cb => { cb.checked = checked; });
        } else if (action === 'reset') {
          // Reset each section to its defaults
          col.querySelectorAll('.section').forEach(sec => {
            const defaults = JSON.parse(sec.dataset.defaults || '[]');
            sec.querySelectorAll('.ext-cb').forEach(cb => {
              cb.checked = defaults.includes(cb.value);
            });
          });
        }
      });
    });

    // Section actions: Check All / Uncheck All / Reset Default
    document.querySelectorAll('.sec-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sec = document.getElementById(btn.dataset.sec);
        if (!sec) return;
        const cbs = sec.querySelectorAll('.ext-cb');
        const action = btn.dataset.action;
        if (action === 'checkAll') {
          cbs.forEach(cb => { cb.checked = true; });
        } else if (action === 'uncheckAll') {
          cbs.forEach(cb => { cb.checked = false; });
        } else if (action === 'resetDefault') {
          const defaults = JSON.parse(sec.dataset.defaults || '[]');
          cbs.forEach(cb => { cb.checked = defaults.includes(cb.value); });
        }
      });
    });

    // Per-extension install
    document.querySelectorAll('.btn-install').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.textContent = '⏳ Installing...';
        btn.style.opacity = '0.5';
        vscode.postMessage({ command: 'installExtension', extensionId: btn.dataset.extId });
      });
    });

    // Uninstall extension
    document.querySelectorAll('.btn-uninstall').forEach(btn => {
      btn.addEventListener('click', () => {
        if (btn.disabled) return;
        const group = btn.closest('.ext-btn-group');
        if (group) {
          const installedBtn = group.querySelector('.btn-installed');
          if (installedBtn) installedBtn.textContent = '⏳ Removing...';
        }
        btn.disabled = true;
        vscode.postMessage({ command: 'uninstallExtension', extensionId: btn.dataset.extId });
      });
    });

    // View in VS Code (opens extension detail with full README)
    document.querySelectorAll('.btn-view').forEach(btn => {
      btn.addEventListener('click', () => {
        vscode.postMessage({ command: 'viewExtension', extensionId: btn.dataset.extId });
      });
    });

    // Install all checked
    const installAllBtn = document.getElementById('installAllBtn');
    installAllBtn.addEventListener('click', () => {
      if (installAllBtn.disabled) return;
      const checked = [];
      document.querySelectorAll('.ext-cb:checked').forEach(cb => checked.push(cb.value));
      if (checked.length === 0) return;
      installAllBtn.disabled = true;
      installAllBtn.textContent = '⏳ Installing ' + checked.length + ' extensions...';
      installAllBtn.style.opacity = '0.5';
      // Disable all individual install buttons too
      document.querySelectorAll('.btn-install').forEach(b => { b.disabled = true; b.style.opacity = '0.5'; });
      vscode.postMessage({ command: 'installAll', extensionIds: checked });
    });

    // Uninstall all checked (only installed ones)
    const uninstallAllBtn = document.getElementById('uninstallAllBtn');
    uninstallAllBtn.addEventListener('click', () => {
      if (uninstallAllBtn.disabled) return;
      const checked = [];
      document.querySelectorAll('.ext-cb:checked').forEach(cb => {
        if (installedSet.has(cb.value.toLowerCase())) checked.push(cb.value);
      });
      if (checked.length === 0) {
        uninstallAllBtn.textContent = '⚠️ No installed extensions checked';
        setTimeout(() => { uninstallAllBtn.textContent = '🗑️ Uninstall All Checked'; }, 2000);
        return;
      }
      uninstallAllBtn.disabled = true;
      uninstallAllBtn.textContent = '⏳ Uninstalling ' + checked.length + ' installed...';
      uninstallAllBtn.style.opacity = '0.5';
      vscode.postMessage({ command: 'uninstallAll', extensionIds: checked });
    });

    // Listen for install/uninstall status messages from extension
    window.addEventListener('message', event => {
      const msg = event.data;
      if (msg.command === 'installComplete') {
        installAllBtn.disabled = false;
        installAllBtn.textContent = '📦 Install All Checked';
        installAllBtn.style.opacity = '1';
        document.querySelectorAll('.btn-install').forEach(b => {
          b.disabled = false; b.textContent = 'Install'; b.style.opacity = '1';
        });
      }
      if (msg.command === 'uninstallComplete') {
        uninstallAllBtn.disabled = false;
        uninstallAllBtn.textContent = '🗑️ Uninstall All Checked';
        uninstallAllBtn.style.opacity = '1';
      }
      if (msg.command === 'extensionInstalled' && msg.extensionId) {
        installedSet.add(msg.extensionId.toLowerCase());
        markDirty();
        const item = document.querySelector('.ext-item[data-ext-id="' + msg.extensionId + '"]');
        if (item) {
          // Update status badge
          const status = item.querySelector('.ext-status');
          if (status) { status.className = 'ext-status ext-status-installed'; status.textContent = '✓'; }
          // Swap Install button -> Installed + Uninstall
          const row = item.querySelector('.ext-row');
          const oldBtn = row.querySelector('.btn-install');
          if (oldBtn) {
            const group = document.createElement('span');
            group.className = 'ext-btn-group';
            group.dataset.extId = msg.extensionId;
            group.innerHTML = '<button class="btn-installed" disabled>✓ Installed</button>' +
              '<button class="btn-uninstall" data-ext-id="' + msg.extensionId + '" title="Uninstall">✕</button>';
            oldBtn.replaceWith(group);
            // Wire up uninstall handler
            group.querySelector('.btn-uninstall').addEventListener('click', () => {
              group.querySelector('.btn-installed').textContent = '⏳ Removing...';
              vscode.postMessage({ command: 'uninstallExtension', extensionId: msg.extensionId });
            });
          }
        }
      }
      if (msg.command === 'extensionUninstalled' && msg.extensionId) {
        installedSet.delete(msg.extensionId.toLowerCase());
        markDirty();
        const item = document.querySelector('.ext-item[data-ext-id="' + msg.extensionId + '"]');
        if (item) {
          // Update status badge
          const status = item.querySelector('.ext-status');
          if (status) { status.className = 'ext-status ext-status-missing'; status.textContent = '○'; }
          // Swap Installed+Uninstall -> Install button
          const row = item.querySelector('.ext-row');
          const group = row.querySelector('.ext-btn-group');
          if (group) {
            const btn = document.createElement('button');
            btn.className = 'btn-install';
            btn.dataset.extId = msg.extensionId;
            btn.title = 'Install';
            btn.textContent = 'Install';
            group.replaceWith(btn);
            btn.addEventListener('click', () => {
              btn.disabled = true;
              btn.textContent = '⏳ Installing...';
              btn.style.opacity = '0.5';
              vscode.postMessage({ command: 'installExtension', extensionId: msg.extensionId });
            });
          }
        }
      }
    });

    // Save
    document.getElementById('saveBtn').addEventListener('click', () => {
      const unchecked = [];
      document.querySelectorAll('.ext-cb').forEach(cb => {
        if (!cb.checked) unchecked.push(cb.value);
      });
      vscode.postMessage({
        command: 'savePacks',
        packIds: selectedPacks,
        uncheckedExtensions: unchecked
      });
      markDirty();
    });

    // ── Dirty state tracking ──
    const exportBtn = document.getElementById('exportBtn');
    function markDirty() {
      if (!exportBtn.classList.contains('dirty')) {
        exportBtn.classList.add('dirty');
        exportBtn.textContent = '📤 Export *';
      }
    }
    function clearDirty() {
      exportBtn.classList.remove('dirty');
      exportBtn.textContent = '📤 Export';
    }

    // Mark dirty on any checkbox change
    document.addEventListener('change', (e) => {
      if (e.target && e.target.classList.contains('ext-cb')) markDirty();
    });

    // Export config (clears dirty)
    exportBtn.addEventListener('click', () => {
      const unchecked = [];
      document.querySelectorAll('.ext-cb').forEach(cb => {
        if (!cb.checked) unchecked.push(cb.value);
      });
      vscode.postMessage({
        command: 'exportConfig',
        packIds: selectedPacks,
        uncheckedExtensions: unchecked
      });
      clearDirty();
    });

    // Import config
    document.getElementById('importBtn').addEventListener('click', () => {
      vscode.postMessage({ command: 'importConfig' });
    });

    // Sync from URL (asks extension host to show input box)
    document.getElementById('syncBtn').addEventListener('click', () => {
      vscode.postMessage({ command: 'askSyncUrl' });
    });
  </script>
</body>
</html>`;
}
