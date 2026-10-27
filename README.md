# Moments

An intent-first Home Assistant dashboard for the iPhone and iPad companion apps. The front door is a single **Now** screen: what needs you, what you probably want to do next, and what is on. Rooms stay one tab away.

## Requirements

- Home Assistant 2025.1 or newer
- [HACS](https://hacs.xyz) (for the HACS install)
- The Home Assistant companion app on iPhone or iPad (any browser works too)

## 1. Install

### Option A: HACS (recommended)

> HACS installs the latest full release. Pre-releases (betas) only show up after you enable beta versions for Moments in HACS.

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

Replace the entities with your own scenes and scripts. [examples/dashboard.yaml](examples/dashboard.yaml) shows every option with comments. The dashboard is generated each time it loads, so new devices and areas appear after a refresh with no editing.

### Strategy options

| Option | Default | Description |
| --- | --- | --- |
| `intents` | first 8 scenes | Buttons for **Do something**. Each has `entity` (scene, script, automation or button) and optional `name`, `label`, `icon`, `when`, `area`/`areas`, `active_entity`. |
| `intents[].when` | none | Contexts that move the intent to the front: `morning`, `day`, `evening`, `night`, and with a light sensor `dark`, `bright`. |
| `intents[].area` / `areas` | house-level | Makes it a room intent. Scripts run from a room receive `area_id`, so one script can serve several rooms. |
| `time_of_day_entity` | local clock | Entity whose state is `morning`, `day`, `evening` or `night`. |
| `illuminance_entity` | none | Outdoor light sensor (lux). Enables the `dark` and `bright` contexts. |
| `dark_below` | `50` | Lux below which it counts as dark. |
| `weather_entity` | first weather entity | Weather shown in the header. |
| `temperature_entity` | none | Indoor temperature shown in the header. |
| `media_players` | all | Media players shown on Now while playing. |
| `rooms_by_user` | none | HA user id to area id. That user's Now leads with **This room**. Use for docked tablets. |
| `room_groups` | HA floors | Named, ordered groups of areas for the Rooms tab. `show_on_now: true` labels that group's "on" entities in On now. |
| `hide_areas` | none | Areas left off the Rooms tab. |
| `areas.<area_id>` | | Per-area `compact`, `domains` and `exclude`. Small areas are compact by default. |
| `schedules` | none | Scheduled automations you can adjust (time, days, sunset offset, on/off). Shown on a Schedules page behind the clock icon, never on Now. |
| `room_schedules` | `true` | Show a one-line schedule summary at the bottom of each room. |
| `chips` | | `battery_threshold`, `exclude`, `finished` (appliances), `schedules_off_after_hours` (opt-in). |
| `on_now` | | `domains`, `exclude`. |

### Optional: time-of-day helper

Without a helper, the clock decides (morning 05:00, day 11:00, evening 17:00, night 22:00). To control it yourself, go to **Settings → Devices & services → Helpers → Create helper → Dropdown**, name it `time_of_day`, add the options `morning`, `day`, `evening` and `night`, and set it from an automation. [examples/time-of-day.yaml](examples/time-of-day.yaml) has a ready-made helper and automation.

## 3. Set it up on your iPhone and iPad

In the companion app on each device:

1. Open the new dashboard from the sidebar.
2. Tap your user name at the bottom of the sidebar to open your profile, and under **Dashboard** choose the new dashboard. This makes it the default on that device only.
3. If a card shows "Custom element doesn't exist", go to the app's **Settings → Companion App → Debugging → Reset frontend cache**, then reopen the app.

## Using the cards on their own

The cards also work in any dashboard, from **Add card → Manual**. All their options are in [examples/cards.yaml](examples/cards.yaml).

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

```yaml
type: custom:moments-header       # greeting, time, weather
weather_entity: weather.home      # optional
```

```yaml
type: custom:moments-schedules    # scheduled automations you can adjust
schedules:
  - name: Wake up
    automation: automation.schedule_wake_up
    time_entity: input_datetime.wake_up_time
```

## Uninstall

Remove the dashboard under **Settings → Dashboards**, then remove Moments in HACS (or delete `/config/www/ha-moments.js` and its resource for a manual install).

To deploy a test build and check it on your devices, see [TESTING.md](TESTING.md). Development notes are in [CONTRIBUTING.md](CONTRIBUTING.md).
