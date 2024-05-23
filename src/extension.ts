import * as vscode from "vscode";
import {
  firacodeActivation,
  extensionActivation,
  extensionDeactivation,
  firstTimeActivation,
  extensionReset,
} from "./util";

export async function activate(context: vscode.ExtensionContext) {
  console.log(
    `Congratulations, your extension "${context.extension.packageJSON.displayName}" installed!`
  );
  firstTimeActivation(context);

  const activateCommand = vscode.commands.registerCommand(
    "npack.activate",
    () => {
      extensionActivation(context);
      firacodeActivation("activate");
    }
  );
  const deactivateCommand = vscode.commands.registerCommand(
    "npack.deactivate",
    () => {
      extensionDeactivation(context);
      firacodeActivation("deactivate");
    }
  );
  const resetCommand = vscode.commands.registerCommand("npack.reset", () =>
    extensionReset(context)
  );
  context.subscriptions.push(activateCommand, deactivateCommand, resetCommand);
}

export function deactivate(context: vscode.ExtensionContext) {
  extensionDeactivation(context);
}
