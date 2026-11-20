# Weather, climate and network

Charts and logs read Home Assistant's history, which keeps 10 days by default. See [troubleshooting](troubleshooting.md#longer-history) to keep more.

## moments-weather

Today in detail, then the next days: condition, rain in mm, wind and gusts, and a low-to-high bar on one shared scale.

```yaml demo width=520
type: custom:moments-weather
entity: weather.home
days: 7
gust_warn: 50
```

| Option | What it does |
| --- | --- |
| `entity` | **Required.** A weather entity with a daily forecast. |
| `days` | 0–7 days after today. |
| `gust_warn` | Gusts at or above this are highlighted, in the entity's wind unit. |

## moments-temperatures

Indoor and outside temperatures: now, today's range, the trend, and a chart.

```yaml demo width=760
type: custom:moments-temperatures
title: Temperatures
outside: sensor.outdoor_temperature
hours: 24
indoor:
  - entity: sensor.living_room_temperature
    name: Living room
  - entity: sensor.office_temperature
    name: Office
  - sensor.bedroom_temperature
```

| Option | What it does |
| --- | --- |
| `indoor` | Temperature sensors: an id, or `entity` with a `name`. |
| `outside` | The outdoor temperature sensor. |
| `hours` | Chart length. `0` hides the chart. |
| `layout` | `grid`, or `row`: all side by side, swiping when they don't fit. |
| `title` | The card title. |

## moments-daylight

Today's outdoor light on a log scale against your dark line, and when it got dark or light. Use the same `dark_below` as your automations.

```yaml demo width=520
type: custom:moments-daylight
title: Daylight
entity: sensor.outdoor_illuminance
dark_below: 50
```

| Option | What it does |
| --- | --- |
| `entity` | **Required.** An outdoor illuminance sensor. |
| `dark_below` | The dark line in lx. |
| `title` | The card title. |

## moments-internet

Online status, the latest speeds, a chart of download speed, and recent outages. Use the Ping integration for online status and the Speedtest integration for speeds.

```yaml demo width=520
type: custom:moments-internet
title: Internet
online: binary_sensor.internet
download: sensor.speedtest_download
upload: sensor.speedtest_upload
ping: sensor.speedtest_ping
```

| Option | What it does |
| --- | --- |
| `online` | A connectivity binary_sensor. |
| `download`, `upload`, `ping` | Speedtest sensors. |
| `days` | Chart length in days. |
| `outage_days`, `max_outages` | How far back to list outages, and how many. |
| `title` | The card title. |
