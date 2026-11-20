# Compose a dashboard

A good place to start is a **Home** view of your areas grouped by floor, each opening an **area view** that follows the same sections in every area. [examples/home.yaml](../../examples/home.yaml) has both, ready to paste.

## 1. Put your areas on floors

In **Settings → Areas, labels & zones**, put each area on a floor (for example Downstairs, Upstairs and Outside), and give each area a picture if you like. Moments reads areas and floors straight from Home Assistant, so cards find their own lights and sensors.

## 2. Create the dashboard

1. Go to **Settings → Dashboards → Add dashboard → New dashboard from scratch**, name it and open it.
2. Choose **✎ Edit → ⋮ → Raw configuration editor**, paste [examples/home.yaml](../../examples/home.yaml), replace the made-up ids with yours, and save.

From then on the visual editor works too.

## The Home view

One section per floor: a `moments-floor-heading`, then a `moments-area` card for each area on it. On a tablet or desktop the floors sit side by side; on a phone they stack.

```yaml demo cols=2
type: grid
cards:
  - type: custom:moments-floor-heading
    floor: downstairs
  - type: custom:moments-floor-heading
    floor: upstairs
  - type: custom:moments-area
    area: living_room
  - type: custom:moments-area
    area: office
  - type: custom:moments-area
    area: kitchen
  - type: custom:moments-area
    area: bedroom
```

Tapping an area card opens the view whose path is the area id, so give each area view `path: <area id>`.

## Area views

Every area uses the same sections in the same order, so you always know where to look. Leave out a section the area has nothing for.

| Section | Cards |
| --- | --- |
| Header (full width) | `moments-area-header`: presence, readings, alerts, all-lights switch |
| Lighting | `moments-tile` per light, and `moments-area-moments` for the area's default and moments |
| Climate & air | `moments-tile` for the thermostat, `moments-metric` for temperature, humidity, CO₂ and light |
| Windows & doors | `moments-tile` for blinds (with `progress: position`), doors and locks |
| Devices | `moments-tile` for appliances, plugs, fans and media |

```yaml
views:
  - title: Living room
    path: living_room              # area cards open the view named after their area
    theme: moments
    type: sections
    max_columns: 3
    sections:
      - type: grid                 # Header, full width
        column_span: 3
        cards:
          - type: custom:moments-area-header
            area: living_room
      - type: grid                 # Lighting
        cards:
          - type: heading
            heading: Lighting
          - type: custom:moments-tile
            entity: light.living_room_ceiling
            tap_action: toggle
          - type: custom:moments-area-moments
            area: living_room
            default: scene.living_room_natural_light
            moments:
              - name: Movie
                icon: mdi:movie-open
                run: scene.living_room_movie
      - type: grid                 # Climate & air
        cards:
          - type: heading
            heading: Climate & air
          - type: custom:moments-metric
            entity: sensor.living_room_temperature
          - type: custom:moments-metric
            entity: sensor.living_room_co2
      - type: grid                 # Windows & doors
        cards:
          - type: heading
            heading: Windows & doors
          - type: custom:moments-tile
            entity: cover.living_room_blind
            progress: position
```

The [home page](../index.html) shows this layout on a tablet, built from the same cards.

## More views

[examples/tabs.yaml](../../examples/tabs.yaml) has more views built from the other cards:

- **Now**: [what's on](house.md#moments-on-now), [alerts](house.md#moments-chips) and [schedules](house.md#moments-schedules).
- **Weather & climate**: [weather](outdoors.md#moments-weather), [temperatures](outdoors.md#moments-temperatures) and [daylight](outdoors.md#moments-daylight).
- **Status**: [internet](outdoors.md#moments-internet) and [appliances](devices.md#moments-appliance).

## Next

Set it as the default dashboard on each device ([Install](install.md#make-it-the-default-on-each-device)), then add the [theme and a backdrop](theme.md).
