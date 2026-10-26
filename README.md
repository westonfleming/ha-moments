# Moments

An intent-first Home Assistant dashboard for iPad and iPhone. Instead of a maze of rooms, the front door is a single **Now** screen: what needs you, what you probably want to do next, and what is on. Rooms stay one tab away.

Moments is a HACS **Dashboard** plugin. It ships one JavaScript file containing:

| Piece | What it does |
| --- | --- |
| `custom:moments` dashboard strategy | Generates a Sections-view **Now** view and a **Rooms** view from your entities and areas. |
| `custom:moments-chips` | Alert chips (open doors, low batteries, problems). Renders nothing when all is well. |
| `custom:moments-intents` | Scene and script buttons, reordered by time of day. |
| `custom:moments-on-now` | Everything that is on or open, with one-tap off. |

## Install

HACS only installs public repositories. While this repo is private, use the manual install under **Develop**.

1. In HACS, open the menu → **Custom repositories**, add `https://github.com/westonfleming/ha-moments` with type **Dashboard**.
2. Install **Moments** and reload the browser (or the companion app).
3. **Settings → Dashboards → Add dashboard → New dashboard from scratch**, open it, choose **Edit → Raw configuration editor**, and replace everything with:

```yaml
strategy:
  type: custom:moments
  time_of_day_entity: input_select.time_of_day   # optional
  intents:
    - entity: scene.morning
      name: Wake up
      icon: mdi:weather-sunny
      when: [morning]
    - entity: scene.cooking
      name: Cooking
      icon: mdi:chef-hat
      when: [evening]
    - entity: scene.movie
      name: Movie
      icon: mdi:movie-open
      when: [evening, night]
    - entity: script.bedtime
      name: Bedtime
      icon: mdi:bed
      when: [night]
```

Without `intents`, Moments uses your first eight scenes. `time_of_day_entity` is any entity whose state is `morning`, `day`, `evening` or `night`; without it, the local clock decides.

The cards can also be used on their own in any dashboard.

## Develop

```sh
npm install
npm run watch      # rebuilds dist/ha-moments.js on change
npm run typecheck
```

To try a build on your HA Green, copy `dist/ha-moments.js` to `/config/www/`, then add `/local/ha-moments.js` as a JavaScript module under **Settings → Dashboards → ⋮ → Resources**.

## Release

Publish a GitHub release (for example `v0.1.0`). The release workflow builds `ha-moments.js` and attaches it, which is what HACS installs.
