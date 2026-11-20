# Moments website

The showcase and docs site, published to GitHub Pages by `.github/workflows/pages.yml`. It is not part of a release.

```sh
npm run site:serve   # build, serve on http://localhost:4173, rebuild on change
npm run site         # build into site/_site
```

| Path | What it is |
| --- | --- |
| `pages/index.html`, `pages/gallery.html` | The home page and gallery bodies. `build.mjs` wraps them in the shared header and footer. |
| `docs/*.md` | The docs. Order and sidebar groups are in `DOCS` in `build.mjs`. Link between pages with `.md`, and to repo files with `../../examples/…`. |
| `src/landing.js`, `src/gallery.js`, `src/docs.js` | Page scripts. |
| `src/common.js`, `src/ha-shim.ts` | Loads the real cards from `../src` and stands in for the few Home Assistant elements they use. |
| `src/mock-home.js` | The made-up home every card is drawn against. Service calls change its state, so cards respond. |
| `src/specs.js` | The gallery's cards and their YAML. |
| `static/` | Copied as is (favicon, `.nojekyll`). |

## Live cards in the docs

A YAML code fence marked `demo` renders the card above its YAML; `preview` renders the card only.

````md
```yaml demo cols=2 backdrop=aurora
type: grid
cards:
  - type: custom:moments-tile
    entity: light.living_room_lamp
```
````

Flags: `cols=N`, `width=PX`, `backdrop=NAME` (mist, aurora, horizon, contour), `narrow1` (one column on phones). In a grid, `grid_options: { columns: full }` makes a card span the row. Entities must exist in `src/mock-home.js`.
