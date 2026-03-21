---
name: release
description: How to release a new version of NDE Hub (npack) via git tags and GitHub Actions
---

# Release NDE Hub

## Prerequisites

- All changes committed and pushed to `main`
- `pnpm run compile` passes without errors
- Version in `package.json` is updated

## Steps

// turbo-all

1. Make sure you're on the latest `main`:

```bash
git checkout main && git pull origin main
```

2. Update version in `package.json` (if not already done):

```bash
# For patch: 1.0.0 → 1.0.1
# For minor: 1.0.0 → 1.1.0
# For major: 1.0.0 → 2.0.0
```

3. Commit version bump (if needed):

```bash
git add package.json && git commit -m "chore: bump version to <VERSION>"
git push origin main
```

4. Create a git tag matching the version:

```bash
git tag v<VERSION>
```

Example: `git tag v1.0.0`

5. Push the tag to trigger GitHub Actions:

```bash
git push origin v<VERSION>
```

Example: `git push origin v1.0.0`

6. Verify the release:

- Go to **GitHub → Actions** tab to watch the workflow
- Once complete, check **GitHub → Releases** for the new release
- The `.vsix` file and auto-generated changelog should be attached

## What the Workflow Does

The `.github/workflows/release.yml` automatically:

1. Checks out code with full git history
2. Sets up Node.js 20 + pnpm 9
3. Installs dependencies (`pnpm install --frozen-lockfile`)
4. Compiles TypeScript (`pnpm run compile`)
5. Packages the extension (`vsce package --no-dependencies`)
6. Generates a changelog from git commits since the last tag
7. Creates a GitHub Release with the `.vsix` file attached

## Troubleshooting

- **Workflow not triggered?** — Tag must start with `v` (e.g., `v1.0.0`)
- **Tag already exists?** — Delete and recreate: `git tag -d v1.0.0 && git push origin :refs/tags/v1.0.0`
- **Build fails?** — Run `pnpm run compile` locally first
- **Frozen lockfile error?** — Run `pnpm install` locally and commit updated `pnpm-lock.yaml`
