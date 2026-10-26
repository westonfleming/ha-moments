# Contributing

## Develop

```sh
npm install
npm run watch      # rebuilds dist/ha-moments.js on change
npm run typecheck
```

To try a build on your Home Assistant, copy `dist/ha-moments.js` to `/config/www/`, then add `/local/ha-moments.js` as a JavaScript module under **Settings → Dashboards → ⋮ → Resources**.

## Release

Publish a GitHub release (for example `v0.1.0`). The release workflow builds `ha-moments.js` and attaches it, which is what HACS installs.
