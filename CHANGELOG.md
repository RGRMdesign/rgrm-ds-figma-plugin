# rgrm-ds-figma-plugin

## 0.1.1

### Patch Changes

- f73d27e: Sync manifest with Figma Community publish requirements (plugin ID and network access declaration). No functional changes.

## 0.1.0

### Minor Changes

- 304fbbc: Initial release of RGRM DS — design system tools for Figma.

  ### Export Variables

  Export all local variable collections as design tokens. Downloads a `figma.zip` with one directory per collection. Single-mode collections export as `tokens.json`; multi-mode collections export one `[mode].tokens.json` file per mode. Tokens follow the Design Tokens Community Group (DTCG) format, including Figma-specific extensions for variable IDs, scopes, and alias metadata.

  ### Document Variables

  Generate documentation instances from a component template. Select a component (or instance), choose a variable collection and mode, and the plugin creates one instance per variable in a vertical auto-layout frame. Template layers are filled automatically based on their name — including variable name, resolved value, type, description, alias/reference details, color swatches, and bound color fills.
