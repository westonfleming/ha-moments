# Moments

An intent-first Home Assistant dashboard for the iPhone and iPad companion apps. The front door is a single **Now** screen: what needs you, what you probably want to do next, and what is on. Rooms stay one tab away.

## Requirements

- Home Assistant 2025.1 or newer
- [HACS](https://hacs.xyz) (for the HACS install)
- The Home Assistant companion app on iPhone or iPad (any browser works too)

## 1. Install

### Option A: HACS (recommended)

> HACS only installs from public repositories. Until this repo is public, use Option B.

1. In Home Assistant, open **HACS**, then **⋮ → Custom repositories**.
2. Add `https://github.com/westonfleming/ha-moments` with type **Dashboard**.
3. Search HACS for **Moments**, open it, and choose **Download**.
4. Reload the page when HACS asks. HACS adds the dashboard resource for you.

### Option B: Manual

1. Download `ha-moments.js` from the latest [release](https://github.com/westonfleming/ha-moments/releases).
2. Copy it to `/config/www/ha-moments.js` on your Home Assistant (the **File editor** or **Samba share** add-on both work on an HA Green). Create the `www` folder if it doesn't exist, then restart Home Assistant once so it serves the folder.
3. Go to **Settings → Dashboards → ⋮ → Resources → Add resource**. If you don't see Resources, turn on **Advanced mode** in your user profile first.
4. Enter URL `/local/ha-moments.js?v=0.1.0`, type **JavaScript module**, and save.

To update a manual install, replace the file and bump the `?v=` number in the resource URL so the apps fetch the new version.

## 2. Create the dashboard

1. Go to **Settings → Dashboards → Add dashboard → New dashboard from scratch**. Name it (for example "Home") and open it.
2. Choose **✎ Edit → ⋮ → Raw configuration editor**, replace everything with the YAML below, and save.

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

Replace the entities with your own scenes and scripts. The dashboard is generated each time it loads, so new devices and areas appear after a refresh with no editing.

### Strategy options

| Option | Default | Description |
| --- | --- | --- |
| `intents` | first 8 scenes | Buttons for the **Do something** row. Each has `entity` (scene, script, automation or button), and optional `name`, `icon` and `when`. |
| `intents[].when` | none | Times of day (`morning`, `day`, `evening`, `night`) when this intent moves to the front. |
| `time_of_day_entity` | local clock | An entity whose state is `morning`, `day`, `evening` or `night`, usually an `input_select` helper set by an automation. |
| `media_players` | all | Media players to show on Now while playing. |

### Optional: time-of-day helper

Without a helper, the clock decides (morning 05:00, day 11:00, evening 17:00, night 22:00). To control it yourself, go to **Settings → Devices & services → Helpers → Create helper → Dropdown**, name it `time_of_day`, add the options `morning`, `day`, `evening` and `night`, and set it from an automation.

## 3. Set it up on your iPhone and iPad

In the companion app on each device:

1. Open the new dashboard from the sidebar.
2. Tap your user name at the bottom of the sidebar to open your profile, and under **Dashboard** choose the new dashboard. This makes it the default on that device only.
3. If a card shows "Custom element doesn't exist", go to the app's **Settings → Companion App → Debugging → Reset frontend cache**, then reopen the app.

## Using the cards on their own

The cards also work in any dashboard, from **Add card → Manual**:

```yaml
type: custom:moments-chips        # alerts that only appear when something needs you
battery_threshold: 15             # optional, percent
exclude: [binary_sensor.garage]   # optional
```

```yaml
type: custom:moments-on-now       # everything that is on or open, with one-tap off
domains: [light, switch, fan, cover]   # optional
exclude: [switch.fridge]               # optional
```

```yaml
type: custom:moments-intents      # scene and script buttons, ordered by time of day
time_of_day_entity: input_select.time_of_day   # optional
intents:
  - entity: scene.movie
    when: [evening]
```

## Uninstall

Remove the dashboard under **Settings → Dashboards**, then remove Moments in HACS (or delete `/config/www/ha-moments.js` and its resource for a manual install).

Development notes are in [CONTRIBUTING.md](CONTRIBUTING.md).
