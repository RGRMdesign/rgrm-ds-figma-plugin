# RGRM DS — Figma Plugin

Design system tools for Figma. The plugin supports multiple options; the first is **Document Variables**.

## Document Variables

Print a variable collection to instances of a component template. One instance is created per variable. Layers in each instance are automatically filled based on their name.

### Usage

1. Create a component template with named layers (see layer mapping below).
2. Select the component (or an instance of it) on the canvas.
3. Open the plugin via **Plugins → Development → RGRM DS**.
4. Choose a variable collection (and mode, if the collection has multiple).
5. Click **Generate instances**.

The plugin places all instances in a vertical auto-layout frame next to the template component.

### Layer mapping

Name layers in your template component exactly as follows:

| Layer name | Content |
|---|---|
| `name` | Variable name |
| `value` | Fully resolved value |
| `alias` / `reference` | Referenced variable name (empty when not an alias) |
| `alias-collection` / `reference-collection` | Collection of referenced variable (empty when not an alias) |
| `type` | `STRING`, `FLOAT`, `BOOLEAN`, or `COLOR` |
| `description` | Variable description |
| `collection` | Source collection name |
| `color` / `swatch` | Fills a shape with the color value (COLOR only) |
| `bind-color` | Binds the COLOR variable to the layer fill |

### Development

Requires **Node 24** and **pnpm**. With nvm:

```bash
nvm use
corepack enable
pnpm install
pnpm run build
```

Import the plugin in Figma via **Plugins → Development → Import plugin from manifest** and select `manifest.json` in this folder.

For live rebuild during development:

```bash
pnpm run watch
```

## Structure

```
src/
  code.ts                          # Plugin entry (Figma sandbox)
  ui/                              # Plugin UI
  features/
    document-variables/            # First option
  shared/                          # Types and message contracts
```

Add new options as an extra tab in the UI and as a feature module under `src/features/`.

## Versioning & releases

This project uses [Changesets](https://github.com/changesets/changesets) for semver, [CHANGELOG.md](CHANGELOG.md), git tags, and GitHub Releases.

When your PR includes user-facing changes in `src/`, add a changeset:

```bash
pnpm changeset
```

After merge to `main`, GitHub Actions opens a **Version Packages** PR. Merging that PR creates a tagged release with build artifacts. Publish the plugin to Figma Community manually — see [docs/RELEASING.md](docs/RELEASING.md).

## License

MIT — see [LICENSE](LICENSE).
