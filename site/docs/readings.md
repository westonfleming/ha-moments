# Metrics and area headers

## moments-metric

One reading, value first: the number, a status word and a sparkline. Humidity, CO₂, PM2.5 and light have sensible levels built in; temperature shows its trend (rising, falling, steady) instead.

```yaml demo cols=3 narrow1
type: grid
cards:
  - type: custom:moments-metric
    entity: sensor.living_room_co2
  - type: custom:moments-metric
    entity: sensor.office_temperature
  - type: custom:moments-metric
    entity: sensor.office_humidity
    name: Humidity
    sparkline: 12
    decimals: 0
    levels:
      - { below: 35, label: Dry, color: fair }
      - { below: 55, label: Just right, color: good }
      - { label: Damp, color: poor }
```

| Option | What it does |
| --- | --- |
| `entity` | **Required.** A sensor. |
| `name` | Default: the entity's name. |
| `levels` | Your own words for the ranges: a list of `{ below, label, color }`, first match wins, and the last needs no `below`. `color` is `good`, `fair`, `poor`, `info` or any CSS colour. |
| `sparkline` | Hours of history to draw (default 24), or `false` to hide it. |
| `decimals` | How many decimals to show. |
| `surface`, `opacity`, `blur` | See [surfaces](devices.md#surfaces). |

## moments-area-header

The top of an area view: the area's name, presence, temperature, humidity, air and light chips, red alert chips, and an all-lights switch. It needs only `area`: it finds the area's temperature, humidity, air quality, light and presence sensors, its lights, and its leak, smoke, gas and problem sensors.

```yaml demo
type: grid
cards:
  - type: custom:moments-area-header
    area: living_room
  - type: custom:moments-area-header
    area: bathroom
```

Alerts and high CO₂ appear as red chips, like the bathroom's leak above.

| Option | What it does |
| --- | --- |
| `area` | **Required.** The area id. |
| `name` | Default: the area's name. |
| `temperature`, `humidity`, `air`, `illuminance`, `presence` | Another entity, or `false` to hide it. Default: found in the area. |
| `lights` | Lights for the count and the all-lights switch, or `false` to hide the switch. |
| `alerts` | Binary sensors that raise a red chip when on, or `false` to turn the found ones off. |
| `show` | Which readings appear, in order. Default `[temperature, humidity, air, illuminance]`. |
| `surface`, `opacity`, `blur` | See [surfaces](devices.md#surfaces). |

```yaml
type: custom:moments-area-header
area: office
name: Study
presence: binary_sensor.office_occupancy
illuminance: false
lights: [light.office_desk, light.office_ceiling]
show: [temperature, air]
surface: glass
```
