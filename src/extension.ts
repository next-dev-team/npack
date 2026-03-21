import * as vscode from "vscode";
import {
  firstTimeActivation,
  extensionReset,
} from "./util";
import { showConfigPanel } from "./configPanel";

export async function activate(context: vscode.ExtensionContext) {
  console.log(
    `Congratulations, your extension "${context.extension.packageJSON.displayName}" installed!`
  );
  firstTimeActivation(context);

  const configureCommand = vscode.commands.registerCommand(
    "npack.configure",
    () => showConfigPanel(context)
  );
  const resetCommand = vscode.commands.registerCommand("npack.reset", () =>
    extensionReset(context)
  );

  const showInstalledCommand = vscode.commands.registerCommand(
    "npack.showInstalled",
    () => vscode.commands.executeCommand("workbench.extensions.search", "@installed")
  );

  // Sidebar webview with horizontal tabs
  const sidebarProvider: vscode.WebviewViewProvider = {
    resolveWebviewView(webviewView) {
      webviewView.webview.options = { enableScripts: true };
      webviewView.webview.html = getSidebarHtml();
      webviewView.webview.onDidReceiveMessage(async (msg) => {
        if (msg.command === "open") {
          switch (msg.id) {
            case "bundles":
              vscode.commands.executeCommand("npack.configure");
              break;
            case "installed":
              vscode.commands.executeCommand("npack.showInstalled");
              break;
            case "reset":
              vscode.commands.executeCommand("npack.reset");
              break;
          }
        } else if (msg.command === "chatOpen" || msg.command === "chatPing") {
          const provider = msg.provider || "auto";
          const chatCmds: Record<string, string[]> = {
            antigravity: ["workbench.action.chat.open", "workbench.action.openChat"],
            vscode: ["workbench.action.chat.open", "workbench.panel.chat.view.copilot.focus"],
            cursor: ["aichat.newchataction", "workbench.action.chat.open"],
            windsurf: ["workbench.action.chat.open"],
          };
          const allCmds = await vscode.commands.getCommands(true);
          const tryList = provider === "auto"
            ? Object.values(chatCmds).flat()
            : chatCmds[provider] || [];
          const cmd = [...new Set(tryList)].find((c) => allCmds.includes(c));

          if (cmd) {
            if (msg.command === "chatPing" && msg.text) {
              await vscode.commands.executeCommand(cmd, { query: msg.text });
            } else {
              await vscode.commands.executeCommand(cmd);
            }
          } else {
            const chatRelated = allCmds.filter((c) =>
              c.toLowerCase().includes("chat") || c.toLowerCase().includes("copilot") || c.toLowerCase().includes("antigravity")
            );
            vscode.window.showWarningMessage(
              `No chat found for "${provider}". Found commands: ${chatRelated.slice(0, 15).join(", ") || "none"}`
            );
          }
        }
      });
    },
  };

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider("npack.sidebar", sidebarProvider),
    configureCommand,
    resetCommand,
    showInstalledCommand
  );
}

export function deactivate() {}

function getSidebarHtml(): string {
  // Quick action buttons for the General tab
  const quickActions = [
    { id: "bundles", icon: "📦", label: "Bundle Config", desc: "Manage extensions" },
    { id: "installed", icon: "📋", label: "Installed", desc: "View installed" },
    { id: "reset", icon: "🔄", label: "Reset Config", desc: "Reset to defaults" },
  ];

  const actionsHtml = quickActions
    .map(
      (a) =>
        `<button class="action-card" data-open="${a.id}">
          <span class="action-icon">${a.icon}</span>
          <span class="action-label">${a.label}</span>
          <span class="action-desc">${a.desc}</span>
        </button>`
    )
    .join("");

  const chatSectionHtml = `
    <div class="chat-section">
      <div class="section-title">💬 Quick Chat</div>
      <div class="chat-provider">
        <label class="chat-label">AI Provider</label>
        <select id="chatProvider" class="chat-select">
          <option value="auto">Auto Detect</option>
          <option value="antigravity">Antigravity</option>
          <option value="vscode">VS Code / Copilot</option>
          <option value="cursor">Cursor</option>
          <option value="windsurf">Windsurf</option>
        </select>
      </div>
      <div class="chat-actions">
        <button class="chat-btn" id="chatOpenBtn">💬 Open Chat</button>
        <button class="chat-btn chat-ping" id="chatPingBtn">⚡ Quick Ping</button>
      </div>
      <input type="text" id="chatInput" class="chat-input" placeholder="Type a message to ping..." />
    </div>
  `;

  const tabs = [
    {
      id: "general",
      icon: "⚡",
      label: "General",
      active: true,
    },
    {
      id: "agent",
      icon: "🤖",
      label: "Agent",
    },
    {
      id: "mcp",
      icon: "🔌",
      label: "MCP",
    },
    {
      id: "skills",
      icon: "🧩",
      label: "Skills",
    },
    {
      id: "rag",
      icon: "📚",
      label: "RAG",
    },
    {
      id: "llm",
      icon: "🧠",
      label: "LLM",
    },
  ];

  const tabsHtml = tabs
    .map(
      (t) =>
        `<button class="tab${t.active ? "" : " disabled"}" data-id="${t.id}">
          <span class="tab-icon">${t.icon}</span>
          <span class="tab-label">${t.label}</span>
          ${t.active ? "" : '<span class="badge">soon</span>'}
        </button>`
    )
    .join("");

  const plannedPanels = tabs
    .filter((t) => !t.active)
    .map(
      (t) =>
        `<div class="panel" id="panel-${t.id}" style="display:none">
          <div class="panel-header">
            <span class="panel-icon">${t.icon}</span>
            <span class="panel-title">${t.label}</span>
            <span class="panel-badge">Coming Soon</span>
          </div>
          <p class="panel-desc">${
            t.id === "agent" ? "AI agent configuration — system prompts, model selection, per-project profiles, and agent rules editor." :
            t.id === "mcp" ? "Discover, install, and configure MCP servers with a visual status dashboard." :
            t.id === "skills" ? "Browse, install, and author agent skills (SKILL.md) with a marketplace." :
            t.id === "rag" ? "RAG-powered codebase context with embeddings, knowledge items, and conversation search." :
            "Local AI server management (Ollama, llama.cpp), API key vault, and model switcher."
          }</p>
        </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: var(--vscode-font-family);
    color: var(--vscode-foreground);
    background: transparent;
  }
  .tabs {
    display: flex; flex-wrap: wrap; gap: 2px;
    padding: 8px 8px 0; background: transparent;
  }
  .tab {
    display: flex; align-items: center; gap: 4px;
    padding: 6px 10px; border: none;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    font-size: 11px; border-radius: 4px 4px 0 0;
    cursor: pointer; opacity: 0.6;
    transition: all 0.15s ease;
  }
  .tab:hover { opacity: 0.85; }
  .tab.active-tab {
    opacity: 1;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
  }
  .tab.disabled { opacity: 0.35; cursor: default; }
  .tab.disabled:hover { opacity: 0.45; }
  .tab-icon { font-size: 12px; }
  .tab-label { font-weight: 500; }
  .badge {
    font-size: 8px; padding: 1px 4px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 3px; text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* General tab — action card grid */
  .action-grid {
    display: grid; grid-template-columns: 1fr 1fr;
    gap: 6px; padding: 10px;
  }
  .action-card {
    display: flex; flex-direction: column; align-items: center;
    gap: 2px; padding: 10px 6px; border: none;
    border-radius: 6px; cursor: pointer;
    background: var(--vscode-button-secondaryBackground);
    color: var(--vscode-button-secondaryForeground);
    transition: all 0.15s ease;
  }
  .action-card:hover {
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    transform: translateY(-1px);
  }
  .action-icon { font-size: 20px; }
  .action-label { font-size: 11px; font-weight: 600; }
  .action-desc { font-size: 9px; opacity: 0.7; text-align: center; }

  /* Chat section */
  .chat-section {
    margin: 6px 10px 0; padding: 10px;
    border-radius: 6px;
    background: var(--vscode-button-secondaryBackground);
  }
  .section-title {
    font-size: 12px; font-weight: 600;
    margin-bottom: 8px;
  }
  .chat-provider {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 8px;
  }
  .chat-label { font-size: 10px; opacity: 0.7; white-space: nowrap; }
  .chat-select {
    flex: 1; padding: 4px 6px; border-radius: 3px;
    border: 1px solid var(--vscode-panel-border);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 11px;
  }
  .chat-actions {
    display: flex; gap: 4px; margin-bottom: 6px;
  }
  .chat-btn {
    flex: 1; padding: 5px 8px; border: none; border-radius: 4px;
    background: var(--vscode-button-background);
    color: var(--vscode-button-foreground);
    font-size: 10px; cursor: pointer; font-weight: 500;
    transition: opacity 0.15s;
  }
  .chat-btn:hover { opacity: 0.9; }
  .chat-btn.chat-ping {
    background: var(--vscode-statusBarItem-prominentBackground, #6c4db3);
  }
  .chat-input {
    width: 100%; padding: 5px 8px; border-radius: 4px;
    border: 1px solid var(--vscode-panel-border);
    background: var(--vscode-input-background);
    color: var(--vscode-input-foreground);
    font-size: 11px;
  }
  .chat-input::placeholder { opacity: 0.5; }

  /* Planned panels */
  .panel { padding: 12px; animation: fadeIn 0.15s ease; }
  @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
  .panel-header {
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 8px; padding-bottom: 8px;
    border-bottom: 1px solid var(--vscode-panel-border);
  }
  .panel-icon { font-size: 18px; }
  .panel-title { font-size: 13px; font-weight: 600; flex: 1; }
  .panel-badge {
    font-size: 10px; padding: 2px 8px;
    background: var(--vscode-badge-background);
    color: var(--vscode-badge-foreground);
    border-radius: 3px;
  }
  .panel-desc {
    font-size: 12px; line-height: 1.5;
    color: var(--vscode-descriptionForeground);
  }
</style>
</head>
<body>
  <div class="tabs">${tabsHtml}</div>
  <div class="panels">
    <div class="panel" id="panel-general" style="display:none">
      <div class="action-grid">${actionsHtml}</div>
      ${chatSectionHtml}
    </div>
    ${plannedPanels}
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    const tabs = document.querySelectorAll('.tab');
    const panels = document.querySelectorAll('.panel');

    function showPanel(id) {
      panels.forEach(p => p.style.display = 'none');
      tabs.forEach(t => t.classList.remove('active-tab'));
      const panel = document.getElementById('panel-' + id);
      const tab = document.querySelector('.tab[data-id="' + id + '"]');
      if (panel) panel.style.display = 'block';
      if (tab) tab.classList.add('active-tab');
    }

    tabs.forEach(tab => {
      tab.addEventListener('click', () => showPanel(tab.dataset.id));
    });

    document.querySelectorAll('.action-card').forEach(card => {
      card.addEventListener('click', () => {
        vscode.postMessage({ command: 'open', id: card.dataset.open });
      });
    });

    // Chat section handlers
    const chatProvider = document.getElementById('chatProvider');
    const chatInput = document.getElementById('chatInput');
    document.getElementById('chatOpenBtn').addEventListener('click', () => {
      vscode.postMessage({ command: 'chatOpen', provider: chatProvider.value });
    });
    document.getElementById('chatPingBtn').addEventListener('click', () => {
      const text = chatInput.value.trim();
      vscode.postMessage({ command: 'chatPing', provider: chatProvider.value, text: text || 'Hello!' });
      chatInput.value = '';
    });
    chatInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const text = chatInput.value.trim();
        vscode.postMessage({ command: 'chatPing', provider: chatProvider.value, text: text || 'Hello!' });
        chatInput.value = '';
      }
    });

    showPanel('general');
  </script>
</body>
</html>`;
}
