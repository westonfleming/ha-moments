# Theme and backdrops

The cards look right in any theme. The Moments theme gives the whole dashboard, stock cards included, the same look: dark, layered tiles with warm amber for "on", and a light mode to match. It also sets the defaults for icon style and tile surface.

## Install the theme

1. Copy [themes/moments.yaml](../../themes/moments.yaml) to `/config/themes/moments.yaml`.
2. Make sure `configuration.yaml` has:

   ```yaml
   frontend:
     themes: !include_dir_merge_named themes
   ```

   then restart once. Later changes only need **Developer tools → Actions → `frontend.reload_themes`**.
3. Set `theme: moments` on each view, as [examples/tabs.yaml](../../examples/tabs.yaml) does, so the rest of Home Assistant keeps your usual theme. Or pick **Moments** as your theme in your profile.

## Theme options

| Variable | What it does |
| --- | --- |
| `moments-icon-style` | `glow` or `crisp`, for every tile without `icon_style`. |
| `moments-tile-surface` | `solid`, `frosted` or `glass`, for every card without `surface`. |
| `moments-tile-opacity` | 0–1, how much card colour shows on frosted and glass cards. |
| `moments-tile-blur` | The blur behind frosted and glass cards, in px. |
| `ha-card-border-radius` | Corner radius for every card. The theme uses `22px`. |

## Backdrops

Each release includes eight backdrops: `mist`, `aurora`, `horizon` and `contour`, each in `-light` and `-dark`. Glass and frosted tiles look best on one.

```yaml preview cols=3 narrow1 backdrop=horizon
type: grid
cards:
  - type: custom:moments-tile
    entity: light.office_desk
    surface: glass
  - type: custom:moments-metric
    entity: sensor.office_co2
    surface: glass
  - type: custom:moments-tile
    entity: fan.office
    surface: glass
```

1. Download the backdrops from the [latest release](https://github.com/westonfleming/ha-moments/releases/latest) and copy them to `/config/www/moments/backdrops/`.
2. Set `lovelace-background` in each theme mode:

```yaml
moments:
  ha-card-border-radius: "22px"
  moments-icon-style: glow
  moments-tile-surface: glass
  modes:
    dark:
      lovelace-background: center / cover no-repeat url("/local/moments/backdrops/mist-dark.svg")
      moments-tile-opacity: "0.55"
      moments-tile-blur: "26"
    light:
      lovelace-background: center / cover no-repeat url("/local/moments/backdrops/mist-light.svg")
      moments-tile-opacity: "0.4"
```

For a backdrop on one view only, set `background:` on that view instead:

```yaml
views:
  - title: Home
    theme: moments
    background: center / cover no-repeat url("/local/moments/backdrops/aurora-dark.svg")
```

See all eight in the [gallery](../gallery.html#theme), or switch between them on the [home page](../index.html).
