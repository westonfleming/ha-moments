# Contributing

## Develop

```sh
npm install
npm run watch      # rebuilds dist/ha-moments.js on change
npm run typecheck
```

To try a build on your Home Assistant, copy `dist/ha-moments.js` to `/config/www/`, then add `/local/ha-moments.js` as a JavaScript module under **Settings → Dashboards → ⋮ → Resources**.

## Configuration

Moments ships no home-specific behaviour. Anything particular to one install (entities, rooms, users, times) is a config option with a sensible default. When you add or change an option, update the annotated example in [examples/](examples/) and the README options table in the same PR.

## Release

Publish a GitHub release (for example `v0.1.0`). The release workflow builds `ha-moments.js` and attaches it, which is what HACS installs.

HACS only offers full releases by default. Use pre-releases (`v0.2.0-beta.1`) for test builds, and keep at least one full release, or HACS falls back to `main`, which has no built file and fails with "Repository structure ... is not compliant".
