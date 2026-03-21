// ───────────────────────────────────────────────────
// npack — Developer Extension Pack Definitions
// ───────────────────────────────────────────────────

export interface PackExtension {
  id: string;
  label: string;
  description?: string;
  /** defaults to true if omitted */
  defaultChecked?: boolean;
}

export type ExtensionGroup =
  | "theme"
  | "icons"
  | "font"
  | "formatter"
  | "linter"
  | "language"
  | "framework"
  | "testing"
  | "tools"
  | "ai"
  | "git"
  | "snippets"
  | "debug";

export interface PackSection {
  group: ExtensionGroup;
  label: string;
  extensions: PackExtension[];
}

export interface Pack {
  id: string;
  label: string;
  icon: string;
  description: string;
  isDefault: boolean;
  sections: PackSection[];
}

// ─── Common sections shared across all packs ────────

const themeSection: PackSection = {
  group: "theme",
  label: "🎨 Theme",
  extensions: [
    { id: "zhuangtongfa.material-theme", label: "One Dark Pro", description: "Atom's iconic One Dark theme" },
  ],
};

const iconsSection: PackSection = {
  group: "icons",
  label: "📁 Icons",
  extensions: [
    { id: "pkief.material-icon-theme", label: "Material Icon Theme", description: "Material Design file icons" },
    { id: "PKief.material-product-icons", label: "Material Product Icons", description: "Material Design product icons" },
  ],
};

const fontSection: PackSection = {
  group: "font",
  label: "🔤 Font",
  extensions: [
    { id: "SeyyedKhandon.firacode", label: "FiraCode Font", description: "Professional font with ligatures" },
  ],
};

const gitSection: PackSection = {
  group: "git",
  label: "🔀 Git",
  extensions: [
    { id: "eamodio.gitlens", label: "GitLens", description: "Supercharge Git within VS Code" },
  ],
};

const commonToolsSection: PackSection = {
  group: "tools",
  label: "🛠️ Common Tools",
  extensions: [
    { id: "EditorConfig.EditorConfig", label: "EditorConfig", description: "EditorConfig support" },
    { id: "streetsidesoftware.code-spell-checker", label: "Code Spell Checker", description: "Spelling checker for code" },
    { id: "christian-kohler.path-intellisense", label: "Path Intellisense", description: "Autocomplete filenames" },
    { id: "aaron-bond.better-comments", label: "Better Comments", description: "Colorful comment annotations" },
    { id: "usernamehw.errorlens", label: "Error Lens", description: "Inline error/warning display" },
  ],
};

const aiSection: PackSection = {
  group: "ai",
  label: "🤖 AI",
  extensions: [
    { id: "Codeium.codeium", label: "Codeium AI", description: "AI-powered code autocomplete", defaultChecked: false },
  ],
};

/** Common sections included in every pack */
export const commonSections: PackSection[] = [
  themeSection,
  iconsSection,
  fontSection,
  gitSection,
  commonToolsSection,
  aiSection,
];

// ─── Pack definitions ───────────────────────────────

export const packs: Pack[] = [
  // ⚡ JavaScript / Web (DEFAULT)
  {
    id: "javascript",
    label: "JavaScript / Web",
    icon: "⚡",
    description: "Full-stack JavaScript, React, and web development",
    isDefault: true,
    sections: [
      {
        group: "formatter",
        label: "✨ Formatter",
        extensions: [
          { id: "esbenp.prettier-vscode", label: "Prettier", description: "Code formatter" },
        ],
      },
      {
        group: "linter",
        label: "🔍 Linter",
        extensions: [
          { id: "dbaeumer.vscode-eslint", label: "ESLint", description: "Integrates ESLint into VS Code" },
        ],
      },
      {
        group: "framework",
        label: "⚛️ Framework & Web",
        extensions: [
          { id: "bradlc.vscode-tailwindcss", label: "Tailwind CSS IntelliSense", description: "Tailwind CSS tooling" },
          { id: "Lokalise.i18n-ally", label: "i18n Ally", description: "Internationalization support" },
          { id: "zachhardesty.convert-object-to-jsx-vscode", label: "Convert Object to JSX", description: "Convert JS objects to JSX" },
          { id: "litiany4.umijs-plugin-model", label: "UmiJS Model", description: "UmiJS model support" },
        ],
      },
      {
        group: "tools",
        label: "🧰 JS Tools",
        extensions: [
          { id: "ms-vscode.sublime-keybindings", label: "Sublime Keybindings", description: "Sublime Text keybindings" },
          { id: "naumovs.color-highlight", label: "Color Highlight", description: "Highlight CSS colors" },
          { id: "christian-kohler.npm-intellisense", label: "npm Intellisense", description: "npm module autocomplete" },
          { id: "mrluges.vscode-goto-node-modules", label: "Go to Node Modules", description: "Navigate to node_modules" },
          { id: "steoates.autoimport", label: "Auto Import", description: "Auto-find and import modules" },
          { id: "GregorBiswanger.json2ts", label: "JSON to TS", description: "Convert JSON to TypeScript" },
          { id: "amih90.to", label: "TO", description: "Text object transformations" },
          { id: "DavidAnson.vscode-markdownlint", label: "Markdown Lint", description: "Markdown linting" },
          { id: "mikestead.dotenv", label: "DotENV", description: ".env file highlighting" },
          { id: "foxundermoon.shell-format", label: "Shell Format", description: "Format shell scripts" },
        ],
      },
    ],
  },

  // ☕ Java
  {
    id: "java",
    label: "Java",
    icon: "☕",
    description: "Java, Spring Boot, and JVM development",
    isDefault: false,
    sections: [
      {
        group: "language",
        label: "☕ Language",
        extensions: [
          { id: "vscjava.vscode-java-pack", label: "Extension Pack for Java", description: "Core Java support (IntelliSense, debug, test, Maven, Gradle)" },
          { id: "vscjava.vscode-lombok", label: "Lombok Support", description: "Lombok annotations support" },
        ],
      },
      {
        group: "framework",
        label: "🌱 Framework",
        extensions: [
          { id: "vmware.vscode-boot-dev-pack", label: "Spring Boot Extension Pack", description: "Spring Boot tools, Initializr, Dashboard" },
        ],
      },
      {
        group: "linter",
        label: "🔍 Quality",
        extensions: [
          { id: "shengchen.vscode-checkstyle", label: "Checkstyle", description: "Code style enforcement" },
          { id: "sonarsource.sonarlint-vscode", label: "SonarLint", description: "Bug & vulnerability detection" },
        ],
      },
      {
        group: "tools",
        label: "🧰 Java Tools",
        extensions: [
          { id: "vscjava.vscode-gradle", label: "Gradle for Java", description: "Gradle project support" },
        ],
      },
    ],
  },

  // 🐍 Python
  {
    id: "python",
    label: "Python",
    icon: "🐍",
    description: "Python, Jupyter, and data science",
    isDefault: false,
    sections: [
      {
        group: "language",
        label: "🐍 Language",
        extensions: [
          { id: "ms-python.python", label: "Python", description: "Core Python support" },
          { id: "ms-python.vscode-pylance", label: "Pylance", description: "Fast IntelliSense & type checking" },
        ],
      },
      {
        group: "formatter",
        label: "✨ Formatter",
        extensions: [
          { id: "ms-python.black-formatter", label: "Black Formatter", description: "Opinionated code formatter" },
          { id: "ms-python.isort", label: "isort", description: "Sort Python imports" },
        ],
      },
      {
        group: "framework",
        label: "📊 Data Science",
        extensions: [
          { id: "ms-toolsai.jupyter", label: "Jupyter", description: "Jupyter notebook support" },
        ],
      },
      {
        group: "testing",
        label: "🧪 Testing",
        extensions: [
          { id: "littlefoxteam.vscode-python-test-adapter", label: "Python Test Explorer", description: "unittest / pytest integration" },
        ],
      },
      {
        group: "tools",
        label: "🧰 Python Tools",
        extensions: [
          { id: "njpwerner.autodocstring", label: "autoDocstring", description: "Generate docstrings" },
        ],
      },
    ],
  },

  // 📱 Flutter / Dart
  {
    id: "flutter",
    label: "Flutter / Dart",
    icon: "📱",
    description: "Flutter mobile/web and Dart development",
    isDefault: false,
    sections: [
      {
        group: "language",
        label: "🎯 Language",
        extensions: [
          { id: "Dart-Code.dart-code", label: "Dart", description: "Dart language support" },
        ],
      },
      {
        group: "framework",
        label: "📱 Framework",
        extensions: [
          { id: "Dart-Code.flutter", label: "Flutter", description: "Flutter framework support" },
        ],
      },
      {
        group: "snippets",
        label: "📝 Snippets",
        extensions: [
          { id: "Nash.awesome-flutter-snippets", label: "Awesome Flutter Snippets", description: "Common Flutter widget snippets" },
        ],
      },
      {
        group: "tools",
        label: "🧰 Flutter Tools",
        extensions: [
          { id: "jeroen-meijer.pubspec-assist", label: "Pubspec Assist", description: "Dependency management" },
          { id: "BendixMa.dart-data-class-generator", label: "Dart Data Class Generator", description: "Generate data class boilerplate" },
          { id: "gmlewis.flutter-stylizer", label: "Flutter Stylizer", description: "Organize Flutter classes" },
        ],
      },
    ],
  },

  // 🦀 Rust
  {
    id: "rust",
    label: "Rust",
    icon: "🦀",
    description: "Rust systems programming",
    isDefault: false,
    sections: [
      {
        group: "language",
        label: "🦀 Language",
        extensions: [
          { id: "rust-lang.rust-analyzer", label: "rust-analyzer", description: "Rust language server (IntelliSense, diagnostics)" },
        ],
      },
      {
        group: "debug",
        label: "🐛 Debug",
        extensions: [
          { id: "vadimcn.vscode-lldb", label: "CodeLLDB", description: "LLDB debugger for Rust" },
        ],
      },
      {
        group: "tools",
        label: "🧰 Rust Tools",
        extensions: [
          { id: "tamasfe.even-better-toml", label: "Even Better TOML", description: "TOML file support (Cargo.toml)" },
          { id: "fill-labs.dependi", label: "Dependi", description: "Dependency management" },
        ],
      },
    ],
  },

  // 🐹 Go
  {
    id: "go",
    label: "Go",
    icon: "🐹",
    description: "Go (Golang) development",
    isDefault: false,
    sections: [
      {
        group: "language",
        label: "🐹 Language",
        extensions: [
          { id: "golang.go", label: "Go", description: "Core Go language support (IntelliSense, debug, test)" },
        ],
      },
      {
        group: "testing",
        label: "🧪 Testing",
        extensions: [
          { id: "premparihar.gotestexplorer", label: "Go Test Explorer", description: "Visual test runner" },
        ],
      },
      {
        group: "tools",
        label: "🧰 Go Tools",
        extensions: [
          { id: "formulahendry.code-runner", label: "Code Runner", description: "Quick code execution" },
        ],
      },
    ],
  },
];

/** Get all extension IDs for a given pack (including common sections) */
export function getPackExtensionIds(packId: string): string[] {
  const pack = packs.find((p) => p.id === packId);
  if (!pack) return [];

  const packExtIds = pack.sections.flatMap((s) => s.extensions.map((e) => e.id));
  const commonExtIds = commonSections.flatMap((s) => s.extensions.map((e) => e.id));

  return [...new Set([...commonExtIds, ...packExtIds])];
}

/** Get the default pack */
export function getDefaultPack(): Pack {
  return packs.find((p) => p.isDefault) ?? packs[0];
}
