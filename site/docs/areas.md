# Areas and floors

Cards for the Home view. They read your areas and floors from **Settings → Areas, labels & zones**.

## moments-area

An area for the Home view: its name, presence, temperature, lights on and alerts, over a faded photo. A tap opens the area's view. It takes the same area options as the [area header](readings.md#moments-area-header).

```yaml demo cols=2
type: grid
cards:
  - type: custom:moments-area
    area: living_room
  - type: custom:moments-area
    area: bedroom
  - type: custom:moments-area
    area: office
    image_style: edge
    image_strength: 0.5
  - type: custom:moments-area
    area: garden
    image_style: full
```

The photo is the area's picture from **Settings → Areas**, or set `image` to any URL (`false` hides it). It's faded so the text stays readable, and turns grey while nobody is there.

| Option | What it does |
| --- | --- |
| `area` | **Required.** The area id. |
| `image` | A picture URL instead of the area's own, or `false` for none. |
| `image_style` | `wash` (default): the card colour over the whole photo. `edge`: the photo fades in on the right. `full`: the whole photo with light text on a shade. `none`: no photo. |
| `image_strength` | 0–1, how much photo shows in `wash` and `edge`. Default 0.3. |
| `dim_when_empty` | Turns the photo grey while nobody is there. Default `true`. |
| `navigation_path` | The view a tap opens. Default: the area id, so name each area view's path after its area. `false`: no tap. |

## moments-floor-heading

A floor's name and a summary of its areas: "2 occupied · 5 lights on · 21.2° avg".

```yaml demo cols=2
type: grid
cards:
  - type: custom:moments-floor-heading
    floor: downstairs
  - type: custom:moments-floor-heading
    name: Outside
    areas: [garden]
```

| Option | What it does |
| --- | --- |
| `floor` | A floor id from **Settings → Areas → Floors**. |
| `areas` | A list of area ids, instead of `floor`. |
| `name` | Default: the floor's name. |
| `summary` | `false` hides the summary line. |
