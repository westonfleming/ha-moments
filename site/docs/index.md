# Introduction

Moments is a set of building blocks for Home Assistant dashboards: cards, animated device icons, a theme and backdrops. You compose them into your own dashboards, views and sections, next to any stock cards. Moments doesn't create a dashboard for you.

```yaml preview cols=3 narrow1 backdrop=mist
type: grid
cards:
  - type: custom:moments-tile
    entity: light.living_room_lamp
    surface: glass
    tap_action: toggle
  - type: custom:moments-tile
    entity: cover.living_room_blind
    progress: position
    surface: glass
  - type: custom:moments-metric
    entity: sensor.living_room_co2
    surface: glass
```

Every card on this site is the real card, drawn against a made-up home. Tap them: they respond.

## What's included

| | |
| --- | --- |
| **15 cards** | Tiles for any device, readings, area headers and area cards, floor headings, area moments, alerts, what's on, schedules, weather, temperatures, daylight, internet and appliances. See the [gallery](../gallery.html) for all of them. |
| **44 icon sets** | Animated icons for every common Home Assistant domain and device class, in Glow and Crisp. See [Icons](icons.md). |
| **A theme** | Dark and light modes with warm amber for "on", so stock cards match too. See [Theme and backdrops](theme.md). |
| **8 backdrops** | Mist, Aurora, Horizon and Contour, each in light and dark, for frosted and glass tiles to sit on. |

## Requirements

- Home Assistant 2025.1 or newer.
- Any device that runs the Home Assistant app or a modern browser. Moments is designed for iPad and iPhone first, and works just as well on wall panels and desktops.

## How the docs are organised

1. [Install](install.md) Moments from Home Assistant, or by hand.
2. [Compose a dashboard](compose.md): a Home view of your areas by floor, and an area view per area.
3. Look up each card: [device cards](devices.md), [metrics and area headers](readings.md), [areas and floors](areas.md), [area moments](area-moments.md), [house-wide cards](house.md), and [weather, climate and network](outdoors.md).
4. Make it yours with the [theme and backdrops](theme.md) and your own [time of day](time-of-day.md).

> Moments is pre-1.0. Card options may still change between releases until 1.0, and the [release notes](https://github.com/westonfleming/ha-moments/releases) say what to update.
