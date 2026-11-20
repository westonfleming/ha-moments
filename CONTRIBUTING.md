# Contributing

## Develop

```sh
npm install
npm run watch      # rebuilds dist/ha-moments.js on change
npm run typecheck
```

To try a build on your Home Assistant, copy `dist/ha-moments.js` to `/config/www/`, then add `/local/ha-moments.js` as a JavaScript module under **Settings → Dashboards → ⋮ → Resources**.

## Configuration

Moments ships no home-specific behaviour. Anything particular to one install (entities, rooms, users, times) is a config option with a sensible default. When you add or change an option, update the annotated example in [examples/](examples/), the README options table and the website docs ([site/docs/](site/docs/)) in the same PR.

## Website

The website in [site/](site/) is the showcase and the docs: the home page, a gallery of every card and icon, and the docs in Markdown. Its cards are the real cards from `src/`, drawn against a sample home in `site/src/mock-home.js`.

```sh
npm run site:serve   # http://localhost:4173, rebuilds on change
npm run site         # builds site/_site
```

The Website workflow publishes it to GitHub Pages on every push to `main` that touches it, and builds it as a check on pull requests. The site is not part of a release: the release ships `dist/ha-moments.js` and the backdrops, and `.gitattributes` keeps `site/` out of the source archives.

## Release

Publish a GitHub release (for example `v0.1.0`). The release workflow builds `ha-moments.js` and attaches it, which is what HACS installs.

HACS only offers full releases by default. Use pre-releases (`v0.2.0-beta.1`) for test builds, and keep at least one full release, or HACS falls back to `main`, which has no built file and fails with "Repository structure ... is not compliant".
