# Examples

Example configuration showing every Moments option. Copy what you need into your own Home Assistant and replace the made-up ids with yours. Nothing here is installed by Moments.

| File | What it shows |
| --- | --- |
| [home.yaml](home.yaml) | A home view of areas grouped by floor, and an area view with the standard sections |
| [tabs.yaml](tabs.yaml) | More views: Now, Weather & climate and Status |
| [scripts.yaml](scripts.yaml) | Scripts a moment can run: area scripts shared by several areas, daylight-aware brightness, movie mode that darkens neighbouring areas, leaving and arriving |
| [schedules.yaml](schedules.yaml) | Helpers and automations behind the dashboard's schedules (time, days, sunset offset) |
| [time-of-day.yaml](time-of-day.yaml) | A time-of-day helper and the automation that sets it |
| [cards.yaml](cards.yaml) | Each card used on its own in any dashboard |

Packages: add `homeassistant: packages: !include_dir_named packages` to `configuration.yaml`, copy a file into `/config/packages/`, and restart.
