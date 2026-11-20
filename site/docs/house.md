# House-wide cards

Cards for a Home or Now view: what's happening, what needs you, and what's next.

## moments-header

A greeting, the time, the weather and the indoor temperature, plus "dark outside" from a light sensor. It updates every minute.

```yaml demo width=760
type: custom:moments-header
weather_entity: weather.home
temperature_entity: sensor.hallway_temperature
time_of_day_entity: input_select.time_of_day
illuminance_entity: sensor.outdoor_illuminance
```

| Option | What it does |
| --- | --- |
| `weather_entity` | A weather entity, for the condition and outside temperature. |
| `temperature_entity` | The indoor temperature. |
| `time_of_day_entity` | `morning`, `day`, `evening` or `night`, for the greeting. Otherwise the clock decides. See [time of day](time-of-day.md). |
| `illuminance_entity`, `dark_below` | An outdoor light sensor, and the lx below which it's "dark outside" (default 50). |
| `area` | An area label to show. |
| `areas_by_user` | An area label per Home Assistant user id, for a shared tablet versus personal phones. |
| `schedules_path` | Adds a clock icon that opens this view. |

## moments-chips

Alerts only when something needs you: open doors and windows, problem, leak, smoke and gas sensors, low batteries, finished appliances and schedules left off. It shows nothing when all is well.

```yaml demo width=760
type: custom:moments-chips
battery_threshold: 15
exclude:
  - binary_sensor.front_door
finished:
  - entity: sensor.dryer_status
    state: finished
    name: Dryer
```

| Option | What it does |
| --- | --- |
| `battery_threshold` | Batteries below this percentage get a chip. |
| `exclude` | Entities that never get a chip. |
| `finished` | Appliances that get a chip when they finish: `entity`, `state` and `name`. |
| `schedules` | Schedules that get a chip when left off (see [moments-schedules](#moments-schedules)). |
| `schedules_off_after_hours` | How long a schedule can be off before it gets a chip. |

## moments-on-now

Everything that's on or open, with one-tap off and **All lights off**. Long lists group by area.

```yaml demo width=520
type: custom:moments-on-now
domains: [light, switch, fan, cover]
exclude:
  - switch.fridge
```

| Option | What it does |
| --- | --- |
| `domains` | Which kinds of entity to list. |
| `exclude` | Entities never listed. |
| `groups` | Areas listed together under one name: `name`, `icon`, `areas`. |

## moments-schedules

Scheduled automations you can adjust in place: on or off, the time, the days, or a sunset offset. The summary form is one quiet line ("2 schedules · next 06:45") that opens the full list.

```yaml demo cols=2
type: grid
cards:
  - type: custom:moments-schedules
    all: true
    schedules:
      - name: Wake up
        icon: mdi:alarm
        automation: automation.schedule_wake_up
        time_entity: input_datetime.wake_up_time
        days_entities:
          - input_boolean.wake_up_mon
          - input_boolean.wake_up_tue
          - input_boolean.wake_up_wed
          - input_boolean.wake_up_thu
          - input_boolean.wake_up_fri
          - input_boolean.wake_up_sat
          - input_boolean.wake_up_sun
        area: bedroom
      - name: Outside lights on
        automation: automation.schedule_outside_lights_on
        sun: sunset
        offset_entity: input_number.outside_lights_offset
  - type: custom:moments-schedules
    area: bedroom
    summary: true
    path: schedules
    schedules:
      - name: Wake up
        automation: automation.schedule_wake_up
        time_entity: input_datetime.wake_up_time
        area: bedroom
```

| Option | What it does |
| --- | --- |
| `schedules` | The schedules. Each has a `name`, an `icon`, its `automation` (whose on/off state enables it), and a `time_entity`, or `sun: sunrise` / `sunset` with an `offset_entity` in minutes. `days_entities` takes one input_boolean per weekday, Monday first. |
| `all` | Show every schedule. Or set `area` for one area's; without either, house-level schedules only. |
| `summary`, `path` | One summary line that opens `path`. |

Each schedule is an automation plus input helpers. [examples/schedules.yaml](../../examples/schedules.yaml) has the helpers and automations ready to copy, and [Time of day and schedules](time-of-day.md) explains them.
