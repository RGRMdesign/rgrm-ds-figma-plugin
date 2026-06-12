# Changesets

Elke PR met gebruikersgerichte wijzigingen in `src/` moet een changeset bevatten.

```bash
pnpm changeset
```

Kies **patch**, **minor** of **major** en beschrijf wat er verandert voor gebruikers van de plugin. Changesets genereert bij een release automatisch `CHANGELOG.md` en bump't de versie in `package.json`.

Zie [docs/RELEASING.md](../docs/RELEASING.md) voor de volledige release-flow.
