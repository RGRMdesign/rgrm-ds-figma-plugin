# Releasing

This plugin uses [Changesets](https://github.com/changesets/changesets) for semver, a generated [CHANGELOG.md](../CHANGELOG.md), git tags, and GitHub Releases. Publishing to Figma Community remains manual.

Git tags and GitHub Releases use the **`vX.Y.Z`** format (for example `v0.1.0`).

## Developer workflow

1. Work in a feature branch and open a PR to `main`.
2. If your PR includes user-facing changes in `src/`, add a changeset:

   ```bash
   pnpm changeset
   ```

   - **patch** — bug fix or small improvement
   - **minor** — new feature, backwards compatible
   - **major** — breaking change

3. Describe what changed from the plugin user's perspective.
4. Wait for CI to pass and merge the PR.

## Automated release (GitHub Actions)

After a merge to `main`:

1. The **Release** workflow opens a **Version Packages** PR when open changesets exist.
2. That PR bumps `package.json`, updates `CHANGELOG.md`, and removes processed changesets.
3. After merging **Version Packages**, the Release workflow on `main`:
   - creates a git tag (`vX.Y.Z`);
   - publishes a [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) with changelog notes;
   - uploads a zip with `dist/` and `manifest.json`.

### Repository settings

Under **Settings → Actions → General → Workflow permissions**, enable:

**Allow GitHub Actions to create and approve pull requests**

Without this, the Version Packages PR cannot be created automatically.

## Figma Community (manual)

After each GitHub Release:

1. Check out the release tag locally (or stay on `main` if it already matches the release version):

   ```bash
   git fetch --tags
   git checkout vX.Y.Z
   pnpm install
   pnpm run build
   ```

   If you are already on `main` with the correct `version` in `package.json`, you can skip the checkout and build directly.

2. Test the plugin in Figma via **Plugins → Development → Import plugin from manifest**.
3. Go to **Plugins → Manage plugins → Publish new version** (or the equivalent in your Figma account).
4. Copy the release notes from the GitHub Release into the Figma release notes field.
5. Publish and wait for review if applicable.

## Upload release asset manually

If the Release workflow succeeds but the zip upload step fails, upload the asset from `main` or the release tag:

```bash
pnpm install
pnpm run build
zip -r rgrm-ds-figma-plugin-v0.1.0.zip dist manifest.json
gh release upload v0.1.0 rgrm-ds-figma-plugin-v0.1.0.zip --clobber
```

If the GitHub Release does not exist yet:

```bash
gh release create v0.1.0 rgrm-ds-figma-plugin-v0.1.0.zip --title "v0.1.0" --notes-file CHANGELOG.md
```

Replace `0.1.0` with the version you are releasing.

## Manual release (without GitHub Actions)

Only needed when CI is unavailable:

```bash
pnpm changeset version   # bump version + changelog
git add .
git commit -m "chore: version packages"
pnpm run build
git tag vX.Y.Z
git push origin main --follow-tags
gh release create vX.Y.Z --title "vX.Y.Z" --notes-file CHANGELOG.md
```

## Viewing version history

- **Changelog** — [CHANGELOG.md](../CHANGELOG.md)
- **Git tags** — `git tag -l 'v*'`
- **GitHub Releases** — Releases tab in the repository
- **Diff between versions** — `git log v0.1.0..v0.2.0`
