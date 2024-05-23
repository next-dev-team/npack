export interface GeneralObject {
  [index: string]: string | number | boolean | GeneralObject;
}
export const defaultSettings = {
  "workbench.iconTheme": "material-icon-theme",
  "workbench.colorTheme": "One Dark Pro Darker",
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.inlineSuggest.enabled": true,
  "editor.fontFamily": "'fira code'",
  "editor.fontLigatures": "true",
  "editor.fontWeight": "normal",
  "editor.fontSize": 12,
};
