import * as vscode from "vscode";
import {
  defaultSettings,
  packSettings,
  type GeneralObject,
} from "./defaultSettings";
const showDialog = vscode.window.showInformationMessage;

const updateUserSettings = (settings: GeneralObject, remove = false) =>
  Object.entries(settings).forEach(([key, value]) =>
    vscode.workspace
      .getConfiguration()
      .update(
        key,
        remove ? undefined : value,
        vscode.ConfigurationTarget.Global
      )
  );

export function firacodeActivation(
  state: "activate" | "deactivate" = "activate"
) {
  const firaCode = vscode.extensions.getExtension("SeyyedKhandon.firacode");
  if (!firaCode) return showDialog('"FiraCode font" extension is missing.');
  firaCode.activate().then(() => {
    vscode.commands.executeCommand(`firacode.${state}`);
  });
}

export function extensionActivation(context: vscode.ExtensionContext) {
  // Apply default settings
  updateUserSettings(defaultSettings);

  // Apply pack-specific settings for all selected packs
  const selectedPacks =
    context.globalState.get<string[]>("npack.selectedPacks") ?? ["javascript"];
  for (const packId of selectedPacks) {
    const extra = packSettings[packId];
    if (extra) {
      updateUserSettings(extra);
    }
  }

  showDialog(`${context.extension.packageJSON.displayName} is activated!`);
}

export async function firstTimeActivation(context: vscode.ExtensionContext) {
  const version = context.extension.packageJSON.version ?? "1.0.0";
  const previousVersion = context.globalState.get(context.extension.id);
  if (previousVersion === version) return;

  // Apply default settings
  extensionActivation(context);
  context.globalState.update(context.extension.id, version);

  // Show onboarding prompt
  const choice = await vscode.window.showInformationMessage(
    "⚡ Welcome to NextDev Pack! Choose your developer bundle (JavaScript, Java, Python, Flutter, Rust, Go) to get the best extensions for your stack.",
    "Configure Bundles",
    "Later"
  );

  if (choice === "Configure Bundles") {
    vscode.commands.executeCommand("npack.configure");
  }
}

export function extensionDeactivation(context: vscode.ExtensionContext) {
  // Remove default settings
  updateUserSettings(defaultSettings, true);

  // Remove pack-specific settings
  const selectedPacks =
    context.globalState.get<string[]>("npack.selectedPacks") ?? ["javascript"];
  for (const packId of selectedPacks) {
    const extra = packSettings[packId];
    if (extra) {
      updateUserSettings(extra, true);
    }
  }

  firacodeActivation("deactivate");
  showDialog(`${context.extension.packageJSON.displayName} is deactivated!`);
}

export function extensionReset(context: vscode.ExtensionContext) {
  context.globalState.update(context.extension.id, undefined);
  context.globalState.update("npack.selectedPacks", undefined);
  context.globalState.update("npack.uncheckedExtensions", undefined);
  extensionDeactivation(context);
}
