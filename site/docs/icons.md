# Icons

`moments-tile` draws one of 44 animated icon sets, each in **Glow** and **Crisp**. Each icon shows the entity's state, and only moves while the device is active. Motion stops when Reduce Motion is on.

```yaml preview cols=4 narrow1
type: grid
cards:
  - type: custom:moments-tile
    entity: sensor.washer_status
    icon_set: washer
    name: Washer
    states:
      running: [run]
    progress: sensor.washer_progress
  - type: custom:moments-tile
    entity: fan.office
  - type: custom:moments-tile
    entity: cover.bedroom_blind
  - type: custom:moments-tile
    entity: binary_sensor.bathroom_leak
```

The [gallery](../gallery.html#icons) shows every set in every state.

## How a set is picked

The set comes from the entity's domain and device class, so most entities need nothing. To choose one yourself, set `icon_set`. Appliances report their own words, so name their set and map the words with `states`:

```yaml
type: custom:moments-tile
entity: sensor.washer_status
icon_set: washer
states:                  # the device's words → the icon's states
  running: [run, rinse, spin]
  done: [finished]
```

## Glow or Crisp

Glow is the default. Choose Crisp per tile with `icon_style: crisp`, or for every tile with `moments-icon-style: crisp` in your theme.

```yaml demo cols=2
type: grid
cards:
  - type: custom:moments-tile
    entity: climate.hallway
    icon_style: glow
    name: Glow
  - type: custom:moments-tile
    entity: climate.hallway
    icon_style: crisp
    name: Crisp
```

## Blinds

Blinds have an icon for every 10% step. A position rounds up to the next step (1–10% shows 10%), and the shade glides between steps. Add `progress: position` to show the position as a bar too.

## Thresholds

Readings pick their icon state from thresholds you can change on the tile: `dark_below` and `bright_above` for light (default 50 and 1000 lx), `cold_below` and `hot_above` for temperature (15 and 26), `dry_below` and `humid_above` for humidity (30 and 60%), and `fair_above` and `poor_above` for air quality (CO₂ 800 and 1200 ppm, PM2.5 12 and 35 µg/m³).

## Every set

| Home Assistant type | `icon_set` | States |
| --- | --- | --- |
| `light` | `light` | on, dim, off |
| `switch`; binary_sensor `plug`, `power` | `plug` | on, off |
| `fan` | `fan` | on, off |
| `lock`; binary_sensor `lock` | `lock` | locked, unlocked, jammed |
| `climate` | `thermostat` | heat, cool, idle, off |
| `cover` door; binary_sensor `door`, `opening` | `door` | closed, open |
| `cover` window; binary_sensor `window` | `window` | closed, open |
| `cover` garage; binary_sensor `garage_door` | `garage` | closed, open, opening, closing |
| `cover` gate | `gate` | closed, open, opening, closing |
| `cover` curtain | `curtain` | closed, partial, open, opening, closing |
| other `cover` (blind, shade, shutter, awning, damper) | `blind` | 0–100 in 10% steps, opening, closing |
| `media_player` tv | `tv` | playing, paused, on, off |
| other `media_player` (speaker, receiver) | `speaker` | playing, paused, on, off |
| `vacuum` | `vacuum` | cleaning, returning, docked, paused, idle, error |
| `lawn_mower` | `mower` | mowing, returning, docked, paused, error |
| `humidifier` | `humidifier` | humidifying, drying, idle, off |
| `water_heater` | `water_heater` | heating, eco, off |
| `valve` | `valve` | open, closed, opening, closing |
| `alarm_control_panel` | `alarm` | disarmed, armed_home, armed_away, armed_night, arming, pending, triggered |
| `camera` | `camera` | recording, streaming, idle, off |
| `siren` | `siren` | on, off |
| `person`, `device_tracker` | `person` | home, away |
| `update`; binary_sensor `update` | `update` | available, installing, up_to_date |
| binary_sensor `motion`, `occupancy`, `presence` | `motion` | detected, clear |
| binary_sensor `smoke` | `smoke` | detected, clear |
| binary_sensor `carbon_monoxide` | `co` | detected, clear |
| binary_sensor `gas` | `gas` | detected, clear |
| binary_sensor `moisture` | `leak` | wet, dry |
| binary_sensor `problem`, `safety`, `tamper` | `problem` | problem, ok |
| binary_sensor `connectivity` | `connectivity` | connected, disconnected |
| binary_sensor `running` | `running` | running, stopped |
| binary_sensor `vibration`, `moving` | `vibration` | detected, clear |
| binary_sensor `sound` | `sound` | detected, clear |
| sensor and binary_sensor `battery`, `battery_charging` | `battery` | full, half, low, empty, charging |
| sensor `temperature`; binary_sensor `cold`, `heat` | `temp` | hot, comfortable, cold |
| sensor `illuminance`; binary_sensor `light` | `lux` | bright, dim, dark |
| sensor `humidity` | `humidity` | humid, comfortable, dry |
| sensor `carbon_dioxide`, `pm25`, `pm10`, `pm1`, `volatile_organic_compounds`, `aqi`, `nitrogen_dioxide`, `ozone` | `air` | good, fair, poor |
| Appliances (name the set with `icon_set`, map their words with `states`) | `coffee`, `washer`, `dishwasher`, `dryer`, `fridge`, `freezer` | see the [gallery](../gallery.html#icons) |