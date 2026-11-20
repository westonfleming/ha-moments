# Device cards

One device per card. `moments-tile` works with any entity, and `moments-appliance` tells the story of a dishwasher or washer.

## moments-tile

One device: a state-aware Moments icon, its name and state, plus an optional programme, metrics, progress bar and finish time. Only `entity` is required. The icon set is picked from the entity's domain and device class (see [Icons](icons.md)), and anything a device can't report is left out.

```yaml demo cols=3 narrow1
type: grid
cards:
  - type: custom:moments-tile
    entity: light.living_room_lamp
    tap_action: toggle
  - type: custom:moments-tile
    entity: cover.office_blind
    progress: position
  - type: custom:moments-tile
    entity: switch.coffee_machine
    icon_set: plug
    name: Coffee machine
    metrics:
      - sensor.coffee_machine_power
      - sensor.coffee_machine_energy_today
    tap_action: toggle
```

| Option | What it does |
| --- | --- |
| `entity` | **Required.** Any entity. |
| `name` | Default: the entity's name. |
| `icon_set` | Which icon to draw. Default: from the entity's domain and device class. |
| `icon_style` | `glow` (default) or `crisp`. Theme default: `moments-icon-style`. |
| `states` | Maps the device's own state words onto the icon's states, e.g. `running: [Run, DelayedStart]`. |
| `secondary` | An entity (e.g. the programme) or plain text after the state. |
| `metrics` | Entities whose values join the state line, e.g. power and energy. |
| `progress` | A 0–100 entity, or `position` for a cover. Draws a bar only when set. |
| `finish` | A timestamp entity shown beside the bar. |
| `surface`, `opacity`, `blur` | See [surfaces](#surfaces). |
| `dark_below`, `bright_above` | Light sensor thresholds in lx. Default 50 and 1000. |
| `cold_below`, `hot_above` | Temperature thresholds. Default 15 and 26. |
| `dry_below`, `humid_above` | Humidity thresholds in %. Default 30 and 60. |
| `fair_above`, `poor_above` | Air quality thresholds. Default per device class (CO₂ 800 and 1200 ppm, PM2.5 12 and 35 µg/m³). |
| `tap_action` | `more-info` (default), `toggle` or `none`. |

### An appliance on a tile

Appliances report their own words, such as Home Connect's `Run` and `Finished`. Name the icon set and map the words onto its states:

```yaml demo
type: custom:moments-tile
entity: sensor.dishwasher_operation_state
icon_set: dishwasher
name: Dishwasher
states:                         # the device's own words → the icon's states
  running: [Run, DelayedStart]
  on: [Ready, Finished]
secondary: sensor.dishwasher_program
progress: sensor.dishwasher_program_progress
finish: sensor.dishwasher_program_finish_time
```

## Surfaces

Tiles, metrics, area headers and area cards take the same three surfaces. `solid` is the default; `frosted` and `glass` let a [backdrop](theme.md#backdrops) show through. Set a theme-wide default with `moments-tile-surface`, and override it per card.

```yaml demo cols=3 narrow1 backdrop=aurora
type: grid
cards:
  - type: custom:moments-tile
    entity: light.kitchen
    surface: solid
  - type: custom:moments-tile
    entity: light.kitchen
    surface: frosted
    opacity: 0.72
    blur: 18
  - type: custom:moments-tile
    entity: light.kitchen
    surface: glass
    opacity: 0.4
    blur: 26
```

| Option | What it does |
| --- | --- |
| `surface` | `solid`, `frosted` or `glass`. Theme default: `moments-tile-surface`, else `solid`. |
| `opacity` | 0–1, how much card colour shows. Default 0.72 frosted, 0.4 glass. Theme default: `moments-tile-opacity`. |
| `blur` | Background blur in px. Default 18 frosted, 26 glass. Theme default: `moments-tile-blur`. |

## moments-appliance

An appliance's programme, progress and finish time, then its recent runs read from history, with kWh per run when a plug measures energy. Entity names below follow the Home Connect integration.

```yaml demo width=420
type: custom:moments-appliance
name: Dishwasher
status: sensor.dishwasher_operation_state
progress: sensor.dishwasher_program_progress
finish_time: sensor.dishwasher_program_finish_time
program: select.dishwasher_active_program
door: sensor.dishwasher_door
energy: sensor.dishwasher_plug_energy
```

| Option | What it does |
| --- | --- |
| `status` | **Required.** The operation state sensor. |
| `name` | The card title. |
| `progress`, `finish_time` | Programme progress (0–100) and the finish timestamp. |
| `program` | The active programme, a sensor or select. |
| `door` | The door state sensor. |
| `energy` | An energy sensor, for kWh per run. |
| `running_states` | States that count as running. Default `[run, pause, delayedstart]`. |
| `finished_states` | States that end a run. Default `[finished]`. |
| `days`, `max_runs` | How far back to look for runs (default 14 days), and how many to list (default 5). |

Run history reads Home Assistant's recorder, which keeps 10 days by default. See [troubleshooting](troubleshooting.md#longer-history) to keep more.
