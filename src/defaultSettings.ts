export interface GeneralObject {
  [index: string]: string | number | boolean | GeneralObject;
}

/** Default settings applied when "Activate" is run (Theme & Editor) */
export const defaultSettings: GeneralObject = {
  "workbench.iconTheme": "material-icon-theme",
  "workbench.colorTheme": "One Dark Pro Darker",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.inlineSuggest.enabled": true,
  "editor.fontFamily": "'fira code'",
  "editor.fontLigatures": "true",
  "editor.fontWeight": "normal",
  "editor.fontSize": 12,
};

/** Per-pack settings overrides */
export const packSettings: Record<string, GeneralObject> = {
  javascript: {
    "editor.defaultFormatter": "esbenp.prettier-vscode",
    "editor.codeActionsOnSave": {
      "source.fixAll.eslint": "always",
      "source.fixAll": "always",
    } as unknown as GeneralObject,
  },
  java: {
    "editor.defaultFormatter": "redhat.java",
  },
  python: {
    "editor.defaultFormatter": "ms-python.black-formatter",
    "python.analysis.typeCheckingMode": "basic",
  },
  flutter: {
    "editor.defaultFormatter": "Dart-Code.dart-code",
    "dart.previewFlutterUiGuides": true,
  },
  rust: {
    "editor.defaultFormatter": "rust-lang.rust-analyzer",
    "rust-analyzer.check.command": "clippy",
  },
  go: {
    "editor.defaultFormatter": "golang.go",
    "go.useLanguageServer": true,
  },
};
