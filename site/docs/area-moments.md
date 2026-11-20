# Area moments

Each area has a default: what its lights do on their own, such as a time-of-day Hue scene or a motion automation. Some areas also have moments that override it for a while, such as Movie or Bedtime. `moments-area-moments` shows them as chips under the area's lights: the default first, then the moments, in the order you list them. One chip is lit at a time.

Try it: tap Reading, then tap it again.

```yaml demo width=560
type: custom:moments-area-moments
area: living_room
default:
  name: Natural
  icon: mdi:weather-sunny
  run: scene.living_room_natural_light
moments:
  - name: Movie
    icon: mdi:movie-open
    run: scene.living_room_movie
  - name: Reading
    icon: mdi:book-open-variant
    run: scene.living_room_reading
    lights: [light.living_room_lamp]
  - name: Dinner
    icon: mdi:silverware-fork-knife
    run: [scene.living_room_dinner, script.dining_music]
    dynamic: true
  - name: Party
    icon: mdi:party-popper
    run: script.party_mode
    active_entity: input_select.living_room_mode
    active_state: Party
```

## When a moment is lit

A moment is active while its lights are on and nobody has adjusted or switched them since it started, while its script runs, or while `active_entity` says so. Running the default ends it.

Tapping a lit chip, moment or default, turns it off: its running scripts stop and its lights go off.

An area with moments but no default shows just the moments, and an area with only a default shows nothing.

## Options

| Option | What it does |
| --- | --- |
| `area` | **Required.** The area id. |
| `moments` | The moments, in the order you want the chips. Each has a `name`, an `icon` and a `run`. |
| `run` | What starts a moment: a scene, script, automation or button, or a list run in order. |
| `default` | The default chip's `name` (default "Default"), `icon` and `run`, or just a run target. Without `run`, the chip turns the area's lights on. |
| `lights` | Lights a moment sets, on a moment or on the card. Otherwise found from the moment's scene (its members or Hue room), then the area. |
| `active_entity`, `active_state` | For a moment the lights can't tell: active while this entity is `on` (or `active_state`; for a select, the option with the moment's name). |
| `dynamic` | The moment changes its lights by itself, so only switching them off ends it. Hue dynamic scenes are detected. |
| `show_default` | `false` hides the default chip. |

## Scripts behind moments

A moment can run anything, so it can be smarter than a scene: dim neighbouring areas for Movie, close the blinds after dark, or set brightness from the daylight outside. [examples/scripts.yaml](../../examples/scripts.yaml) has scripts for all of these, including area scripts several areas can share.

```yaml
type: custom:moments-area-moments
area: bathroom
lights: [light.bathroom]
default:
  name: Motion
  icon: mdi:motion-sensor       # no run: the chip turns the lights on
moments:
  - name: Bath
    icon: mdi:bathtub
    run: scene.bathroom_candlelight
    dynamic: true
  - name: Shower
    icon: mdi:shower-head
    run: script.shower
    active_entity: input_boolean.shower_mode
```
