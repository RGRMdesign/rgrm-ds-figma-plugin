# Release-proces

Deze plugin gebruikt [Changesets](https://github.com/changesets/changesets) voor versiebeheer, een gegenereerde changelog, git-tags en GitHub Releases. Publicatie naar Figma Community blijft handmatig.

## Dagelijkse workflow (developers)

1. Werk in een feature branch en open een PR naar `main`.
2. Voeg een changeset toe als er gebruikersgerichte wijzigingen in `src/` zitten:

   ```bash
   pnpm changeset
   ```

   - **patch** — bugfix, kleine verbetering
   - **minor** — nieuwe feature, backwards compatible
   - **major** — breaking change

3. Beschrijf wat er verandert vanuit het perspectief van plugin-gebruikers.
4. Wacht tot CI groen is en merge de PR.

## Automatische release (GitHub Actions)

Na merge op `main`:

1. De **Release** workflow opent een PR **Version Packages** als er open changesets liggen.
2. Die PR bump't `package.json`, werkt `CHANGELOG.md` bij en verwijdert verwerkte changesets.
3. Na merge van **Version Packages**:
   - maakt GitHub Actions een git-tag (`vX.Y.Z`);
   - publiceert een [GitHub Release](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) met release notes uit de changelog;
   - uploadt een zip met `dist/` en `manifest.json`.

## Figma Community publicatie (handmatig)

Na elke GitHub Release:

1. Checkout de release-tag lokaal:

   ```bash
   git fetch --tags
   git checkout vX.Y.Z
   pnpm install
   pnpm run build
   ```

2. Test de plugin in Figma via **Plugins → Development → Import plugin from manifest**.
3. Ga naar **Plugins → Manage plugins → Publish new version** (of equivalent in je Figma-account).
4. Kopieer de release notes uit de GitHub Release naar het Figma release-notes veld.
5. Publiceer en wacht op review indien van toepassing.

## Handmatige release (zonder GitHub Actions)

Alleen nodig als CI niet beschikbaar is:

```bash
pnpm changeset version   # bump versie + changelog
pnpm release             # build
git add .
git commit -m "chore: version packages"
git tag vX.Y.Z
git push origin main --tags
gh release create vX.Y.Z --notes-file <(sed -n '/^## /,$p' CHANGELOG.md | head -n 20)
```

## Versiehistorie bekijken

- **Changelog** — [CHANGELOG.md](../CHANGELOG.md)
- **Git tags** — `git tag -l 'v*'`
- **GitHub Releases** — tab Releases in de repository
- **Diff tussen versies** — `git log v0.1.0..v0.2.0`
