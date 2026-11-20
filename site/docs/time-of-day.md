# Time of day and schedules

## Time of day

The header's greeting follows the time of day. Without a helper, the clock decides: morning from 05:00, day from 11:00, evening from 17:00 and night from 22:00.

To control it yourself, for example from sunrise and sunset or from who's home:

1. Create a **Dropdown** helper named `time_of_day` with the options `morning`, `day`, `evening` and `night` (**Settings → Devices & services → Helpers → Create helper**).
2. Set it from an automation. [examples/time-of-day.yaml](../../examples/time-of-day.yaml) has a ready-made helper and automation.
3. Pass it to the cards that use it:

```yaml
type: custom:moments-header
time_of_day_entity: input_select.time_of_day
```

## Schedules

`moments-schedules` lets you adjust scheduled automations from the dashboard: on or off, the time, the days, or a sunset offset. Each schedule is an ordinary automation that reads its time and days from helpers. Moments edits the helpers and turns the automation on or off; it never changes the automation itself.

A schedule needs:

| Part | Helper |
| --- | --- |
| On or off | The automation itself, e.g. `automation.schedule_wake_up` |
| The time | An `input_datetime` with time only, e.g. `input_datetime.wake_up_time` |
| The days (optional) | Seven `input_boolean`s, Monday first |
| A sun offset (instead of a time) | An `input_number` in minutes, with `sun: sunrise` or `sun: sunset` |

[examples/schedules.yaml](../../examples/schedules.yaml) has the helpers and automations for wake-up, outside lights and bedtime, as a package.

## Using packages

The examples are Home Assistant packages. Add this to `configuration.yaml`, copy a file into `/config/packages/`, and restart:

```yaml
homeassistant:
  packages: !include_dir_named packages
```
