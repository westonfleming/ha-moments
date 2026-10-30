# Examples

Example configuration showing every Moments option. Copy what you need into your own Home Assistant and replace the made-up ids with yours. Nothing here is installed by Moments.

| File | What it shows |
| --- | --- |
| [tabs.yaml](tabs.yaml) | A dashboard built from the cards: Now, Weather & climate and Status tabs |
| [dashboard.yaml](dashboard.yaml) | The full dashboard config, every option annotated, for a made-up home |
| [scripts.yaml](scripts.yaml) | Scripts for intents: room scripts shared by several rooms, daylight-aware brightness, movie mode that darkens neighbouring rooms, leaving and arriving |
| [schedules.yaml](schedules.yaml) | Helpers and automations behind the dashboard's schedules (time, days, sunset offset) |
| [time-of-day.yaml](time-of-day.yaml) | A time-of-day helper and the automation that sets it |
| [cards.yaml](cards.yaml) | Each card used on its own in any dashboard |

Packages: add `homeassistant: packages: !include_dir_named packages` to `configuration.yaml`, copy a file into `/config/packages/`, and restart.
