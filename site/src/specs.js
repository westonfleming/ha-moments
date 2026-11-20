// What the gallery shows. Each card spec renders its YAML live, then prints that same YAML.
// A YAML with `cards:` is a dashboard section (type: grid); each of its cards renders in order.

export const SET_NAMES = { light: "Light", lock: "Lock", door: "Door", blind: "Blind", thermostat: "Thermostat", plug: "Plug", fan: "Fan", coffee: "Coffee machine", washer: "Washer", dishwasher: "Dishwasher", dryer: "Dryer", fridge: "Fridge", freezer: "Freezer", lux: "Light sensor", motion: "Motion", temp: "Temperature", window: "Window", garage: "Garage door", gate: "Gate", curtain: "Curtains", tv: "TV", speaker: "Speaker", vacuum: "Robot vacuum", mower: "Robot mower", humidifier: "Humidifier", water_heater: "Water heater", valve: "Valve", alarm: "Alarm panel", camera: "Camera", siren: "Siren", person: "Person", smoke: "Smoke alarm", co: "CO alarm", gas: "Gas detector", leak: "Leak sensor", problem: "Problem", connectivity: "Connectivity", battery: "Battery", running: "Running", vibration: "Vibration", sound: "Sound", update: "Update", humidity: "Humidity", air: "Air quality" };

export const ICON_NOTES = {
  light: {
    note: "Any light. Dim below 40% brightness.",
    yaml: `type: custom:moments-tile
entity: light.living_room_lamp        # icon_set: light is picked automatically
tap_action: toggle                    # more-info (default) | toggle | none`,
  },
  lock: {
    note: "Any lock. Jammed is drawn in red.",
    yaml: `type: custom:moments-tile
entity: lock.front_door               # locked | unlocked | jammed`,
  },
  door: {
    note: "Door and opening sensors, and door covers.",
    yaml: `type: custom:moments-tile
entity: binary_sensor.patio_door      # device_class door or opening
name: Patio door`,
  },
  blind: {
    note: "Blind, shade, shutter and awning covers. Position rounds up to the next 10% step (1–10% shows 10), and the shade glides between steps.",
    yaml: `type: custom:moments-tile
entity: cover.living_room_blind
progress: position                    # adds the position as a bar`,
  },
  thermostat: {
    note: "Climate entities, from hvac_action first, then the mode.",
    yaml: `type: custom:moments-tile
entity: climate.hallway               # heating → heat, cooling → cool, idle, off`,
  },
  plug: {
    note: "Switches. Power and energy can join the state line.",
    yaml: `type: custom:moments-tile
entity: switch.coffee_machine
icon_set: plug
metrics: [sensor.coffee_machine_power, sensor.coffee_machine_energy_today]`,
  },
  fan: {
    note: "Fans. The blades only spin while it is on.",
    yaml: `type: custom:moments-tile
entity: fan.office
tap_action: toggle`,
  },
  coffee: {
    note: "Coffee machines, usually a plug or a status sensor. Name it with icon_set.",
    yaml: `type: custom:moments-tile
entity: sensor.coffee_machine_status
icon_set: coffee
states:                               # the machine's own words → icon states
  brewing: [Brewing, Heating]
  ready: [Ready]`,
  },
  washer: {
    note: "Washing machines. Run, running, pause and delayed start count as running.",
    yaml: `type: custom:moments-tile
entity: sensor.washer_status
icon_set: washer
name: Washer
progress: sensor.washer_progress`,
  },
  dishwasher: {
    note: "Dishwashers. On means ready or finished with the door shut.",
    yaml: `type: custom:moments-tile
entity: sensor.dishwasher_operation_state
icon_set: dishwasher
states:
  running: [Run, DelayedStart]
  on: [Ready, Finished]`,
  },
  dryer: {
    note: "Tumble dryers. Finished, complete and end count as done.",
    yaml: `type: custom:moments-tile
entity: sensor.dryer_status
icon_set: dryer
name: Dryer`,
  },
  fridge: {
    note: "A fridge's door sensor.",
    yaml: `type: custom:moments-tile
entity: binary_sensor.fridge_door
icon_set: fridge
name: Fridge`,
  },
  freezer: {
    note: "A freezer's door sensor (ok or open), or map a warm alert onto warm.",
    yaml: `type: custom:moments-tile
entity: binary_sensor.freezer_alarm
icon_set: freezer
states:
  warm: ["on"]                        # an alarm sensor that is on → warm`,
  },
  lux: {
    note: "Illuminance sensors. Dark below 50 lx, bright from 1000 lx; both are adjustable.",
    yaml: `type: custom:moments-tile
entity: sensor.outdoor_illuminance
dark_below: 50                        # lx, default 50
bright_above: 1000                    # lx, default 1000`,
  },
  motion: {
    note: "Motion, occupancy and presence sensors.",
    yaml: `type: custom:moments-tile
entity: binary_sensor.hall_motion     # detected | clear`,
  },
  temp: {
    note: "Temperature sensors. Cold at 15° and below, hot from 26°; both are adjustable.",
    yaml: `type: custom:moments-tile
entity: sensor.bedroom_temperature
cold_below: 16                        # default 15
hot_above: 25                         # default 26`,
  },
  window: {
    note: 'Window contacts and motorised windows.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.bedroom_window   # device_class window → closed | open`,
  },
  garage: {
    note: 'Garage doors, as a cover or a garage_door contact. Opening and closing roll the door.',
    yaml: `type: custom:moments-tile
entity: cover.garage_door            # device_class garage
tap_action: toggle`,
  },
  gate: {
    note: 'Gate covers. The leaves swing while it opens or closes.',
    yaml: `type: custom:moments-tile
entity: cover.driveway_gate          # device_class gate`,
  },
  curtain: {
    note: 'Curtain covers. Partial for any position between closed and open.',
    yaml: `type: custom:moments-tile
entity: cover.living_room_curtains   # device_class curtain
progress: position`,
  },
  tv: {
    note: 'Media players with device_class tv.',
    yaml: `type: custom:moments-tile
entity: media_player.living_room_tv  # playing | paused | on (idle) | off (standby)`,
  },
  speaker: {
    note: 'Every other media player: speakers, receivers, casts.',
    yaml: `type: custom:moments-tile
entity: media_player.kitchen_speaker
secondary: Spotify`,
  },
  vacuum: {
    note: 'Robot vacuums, straight from the vacuum states.',
    yaml: `type: custom:moments-tile
entity: vacuum.robot                 # cleaning | returning | docked | paused | idle | error`,
  },
  mower: {
    note: 'Robot lawn mowers.',
    yaml: `type: custom:moments-tile
entity: lawn_mower.garden_mower`,
  },
  humidifier: {
    note: 'Humidifiers and dehumidifiers, from their action.',
    yaml: `type: custom:moments-tile
entity: humidifier.bedroom           # action humidifying | drying | idle, or off`,
  },
  water_heater: {
    note: 'Water heaters. Eco and heat pump modes show the leaf.',
    yaml: `type: custom:moments-tile
entity: water_heater.hot_water`,
  },
  valve: {
    note: 'Water and gas valves.',
    yaml: `type: custom:moments-tile
entity: valve.main_water             # open | closed | opening | closing
tap_action: toggle`,
  },
  alarm: {
    note: 'Alarm panels. Vacation shows as away, custom bypass as home.',
    yaml: `type: custom:moments-tile
entity: alarm_control_panel.house`,
  },
  camera: {
    note: 'Cameras.',
    yaml: `type: custom:moments-tile
entity: camera.front_porch           # recording | streaming | idle | off`,
  },
  siren: {
    note: 'Sirens.',
    yaml: `type: custom:moments-tile
entity: siren.hallway`,
  },
  person: {
    note: 'People and device trackers. Any zone other than home shows as away.',
    yaml: `type: custom:moments-tile
entity: person.sam
secondary: sensor.sam_phone_battery_level`,
  },
  smoke: {
    note: 'Smoke alarms.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.hall_smoke      # device_class smoke`,
  },
  co: {
    note: 'Carbon monoxide alarms.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.boiler_co       # device_class carbon_monoxide`,
  },
  gas: {
    note: 'Gas detectors.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.kitchen_gas     # device_class gas`,
  },
  leak: {
    note: 'Leak and moisture sensors.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.bathroom_leak   # device_class moisture → wet | dry`,
  },
  problem: {
    note: 'Problem, safety and tamper sensors.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.boiler_fault    # device_class problem`,
  },
  connectivity: {
    note: 'Connectivity sensors, e.g. from the Ping integration.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.internet       # device_class connectivity`,
  },
  battery: {
    note: 'Battery levels (full from 60%, half from 25%, low from 10%), low-battery and charging sensors.',
    yaml: `type: custom:moments-tile
entity: sensor.hall_motion_battery   # device_class battery`,
  },
  running: {
    note: 'Running sensors for any machine or pump.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.pool_pump      # device_class running`,
  },
  vibration: {
    note: 'Vibration and moving sensors.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.washer_vibration`,
  },
  sound: {
    note: 'Sound sensors.',
    yaml: `type: custom:moments-tile
entity: binary_sensor.nursery_sound`,
  },
  update: {
    note: 'Update entities and update sensors. Installing while in progress.',
    yaml: `type: custom:moments-tile
entity: update.home_assistant_core`,
  },
  humidity: {
    note: 'Humidity sensors. Dry below 30%, humid from 60%; both are adjustable.',
    yaml: `type: custom:moments-tile
entity: sensor.bathroom_humidity
dry_below: 35                         # %, default 30
humid_above: 65                       # %, default 60`,
  },
  air: {
    note: 'CO₂, particulate, VOC, NO₂, ozone and AQI sensors, with levels per device class.',
    yaml: `type: custom:moments-tile
entity: sensor.office_co2
fair_above: 800                       # default per device class
poor_above: 1200`,
  },
};

export const SECTIONS = [
  {
    id: "devices",
    title: "Device cards",
    lede: "One device or one reading per card. Drop them into any section next to stock cards.",
    specs: [
      {
        id: "tile",
        type: "moments-tile",
        blurb: "One device: a state-aware Moments icon, its name and state, plus an optional programme, metrics, progress bar and finish time. Only entity is required; anything the device can't report is left out.",
        needs: "Any entity",
        cols: 3,
        yaml: `type: grid
cards:
  # The smallest tile: the icon set comes from the entity.
  - type: custom:moments-tile
    entity: light.living_room_lamp

  # Every option at once: a dishwasher with its programme, progress and finish time.
  - type: custom:moments-tile
    entity: sensor.dishwasher_operation_state
    icon_set: dishwasher            # light, lock, door, blind, thermostat, plug, fan, coffee,
                                    # washer, dishwasher, dryer, fridge, freezer, lux, motion, temp
    icon_style: glow                # glow (default) | crisp; theme default: moments-icon-style
    name: Dishwasher
    states:                         # the device's own words → the icon's states
      running: [Run, DelayedStart]
      on: [Ready, Finished]
    secondary: sensor.dishwasher_program   # an entity, or plain text such as "Eco"
    progress: sensor.dishwasher_program_progress   # 0–100, or "position" for a cover
    finish: sensor.dishwasher_program_finish_time  # timestamp shown beside the bar
    tap_action: more-info           # more-info (default) | toggle | none

  # A plug with power and energy on the state line.
  - type: custom:moments-tile
    entity: switch.coffee_machine
    icon_set: plug
    name: Coffee machine
    metrics:
      - sensor.coffee_machine_power
      - sensor.coffee_machine_energy_today
    tap_action: toggle

  # A blind: 10% icon steps, the position as a bar, drawn Crisp.
  - type: custom:moments-tile
    entity: cover.office_blind
    progress: position
    icon_style: crisp

  - type: custom:moments-tile
    entity: climate.hallway

  - type: custom:moments-tile
    entity: lock.back_door`,
      },
      {
        id: "surfaces",
        type: "surface · opacity · blur",
        title: "Surfaces",
        blurb: "Tiles, metrics, area headers and area cards take the same three surfaces. Solid is the default; frosted and glass let a backdrop show through. Set a theme-wide default and override it per card.",
        needs: "A backdrop, for frosted and glass to show",
        cols: 3,
        narrow1: true,
        backdrop: true,
        yaml: `type: grid
cards:
  - type: custom:moments-tile
    entity: light.kitchen
    surface: solid                  # the default; opacity and blur are ignored

  - type: custom:moments-tile
    entity: light.kitchen
    surface: frosted
    opacity: 0.72                   # 0–1, how much card colour shows (frosted default 0.72)
    blur: 18                        # px (frosted default 18)

  - type: custom:moments-tile
    entity: light.kitchen
    surface: glass
    opacity: 0.4                    # glass default 0.4
    blur: 26                        # glass default 26`,
      },
      {
        id: "metric",
        type: "moments-metric",
        blurb: "One reading, value first, with a status word and a sparkline. Humidity, CO₂, PM2.5 and light have sensible levels built in; temperature shows its trend instead.",
        needs: "A sensor",
        cols: 3,
        narrow1: true,
        yaml: `type: grid
cards:
  # Built-in levels for CO₂, and a 24-hour sparkline.
  - type: custom:moments-metric
    entity: sensor.living_room_co2

  # Temperature shows its trend (rising, falling, steady) instead of a level.
  - type: custom:moments-metric
    entity: sensor.office_temperature
    sparkline: false                # hours of history (default 24), or false to hide

  # Your own words for the ranges.
  - type: custom:moments-metric
    entity: sensor.office_humidity
    name: Humidity
    sparkline: 12
    decimals: 0
    levels:                         # first match wins; the last one needs no "below"
      - { below: 35, label: Dry, color: fair }    # good | fair | poor | info | any CSS colour
      - { below: 55, label: Just right, color: good }
      - { label: Damp, color: poor }
    surface: frosted                # solid | frosted | glass, with opacity and blur`,
      },
      {
        id: "appliance",
        type: "moments-appliance",
        blurb: "An appliance's programme, progress and finish time, then its recent runs read from history, with kWh per run when a plug measures energy.",
        needs: "Status and progress sensors, e.g. from Home Connect",
        cols: 1,
        width: 420,
        yaml: `type: custom:moments-appliance
name: Dishwasher
status: sensor.dishwasher_operation_state
progress: sensor.dishwasher_program_progress
finish_time: sensor.dishwasher_program_finish_time
program: select.dishwasher_active_program
door: sensor.dishwasher_door
energy: sensor.dishwasher_plug_energy    # optional: adds kWh per run
running_states: [run, pause, delayedstart]   # default as shown
finished_states: [finished]
days: 14                          # how far back to look for runs
max_runs: 5`,
      },
    ],
  },
  {
    id: "areas",
    title: "Areas and floors",
    lede: "Cards that find their own entities from an HA area or floor. Override any part, or hide it with false.",
    specs: [
      {
        id: "area-header",
        type: "moments-area-header",
        blurb: "The top of an area view: name, presence, temperature, humidity, air and light chips, red alert chips, and an all-lights switch. Everything is discovered from the area.",
        needs: "An area",
        cols: 1,
        width: 760,
        yaml: `type: grid
cards:
  # Everything found in the area.
  - type: custom:moments-area-header
    area: living_room

  # Overrides: a different name, chosen sensors, fewer readings.
  - type: custom:moments-area-header
    area: office
    name: Study
    presence: binary_sensor.office_occupancy   # or false to hide
    temperature: sensor.office_temperature
    humidity: false
    air: sensor.office_co2            # CO₂ above its "poor" level also raises a red chip
    illuminance: false
    lights: [light.office_desk, light.office_ceiling]   # the all-lights switch; false hides it
    alerts: []                        # list of alert sensors, or false; default: leak, smoke, gas, problem
    show: [temperature, air]          # which readings, in order
    surface: glass
    opacity: 0.5`,
      },
      {
        id: "area",
        type: "moments-area",
        blurb: "An area for the home view: name, presence, temperature, lights on and alerts, over a faded photo. A tap opens the view whose path is the area id.",
        needs: "An area (a picture in Settings → Areas, or image:)",
        cols: 2,
        yaml: `type: grid
cards:
  - type: custom:moments-area
    area: living_room               # wash: card colour over the whole photo (default)

  - type: custom:moments-area
    area: office
    image_style: edge               # wash | edge | full | none
    image_strength: 0.45            # 0–1, wash and edge only (default 0.3)

  - type: custom:moments-area
    area: bedroom
    image_style: full               # whole photo, light text on a shade
    dim_when_empty: true            # greyscale while nobody is there (default true)

  - type: custom:moments-area
    area: bathroom
    image: /local/areas/bathroom.jpg   # any URL; false hides the photo
    image_style: none
    navigation_path: bathroom       # the view a tap opens; false turns the tap off
    # Also takes every moments-area-header option: name, presence, temperature, humidity,
    # air, illuminance, lights, alerts, show, surface, opacity, blur.`,
      },
      {
        id: "floor-heading",
        type: "moments-floor-heading",
        blurb: "A floor's name and a one-line summary of its areas: occupied, lights on and average temperature. Put one at the top of each floor's section.",
        needs: "A floor, or a list of areas",
        cols: 2,
        yaml: `type: grid
cards:
  - type: custom:moments-floor-heading
    floor: downstairs               # floor id from Settings → Areas → Floors

  - type: custom:moments-floor-heading
    name: Outside                   # default: the floor's name
    areas: [garden]                 # instead of floor
    summary: true                   # false hides the summary line`,
      },
      {
        id: "area-moments",
        type: "moments-area-moments",
        blurb: "An area's default and the moments that override it, as chips under its lights. One chip is lit at a time; tapping a lit chip turns it off. Chips keep the order you list them in. Try tapping them.",
        needs: "Scenes, scripts, automations or buttons",
        cols: 1,
        width: 560,
        yaml: `type: custom:moments-area-moments
area: living_room
# lights: [light.living_room_ceiling, light.living_room_lamp]   # optional; found from the scenes otherwise
default:                          # or just: default: scene.living_room_natural_light
  name: Natural
  icon: mdi:weather-sunny
  run: scene.living_room_natural_light   # without run, the chip turns the lights on
show_default: true                # false hides the default chip
moments:
  - name: Movie                   # lit: its lights are on and untouched since it started
    icon: mdi:movie-open
    run: scene.living_room_movie
  - name: Reading
    icon: mdi:book-open-variant
    run: scene.living_room_reading
    lights: [light.living_room_lamp]     # the lights this moment sets
  - name: Dinner
    icon: mdi:silverware-fork-knife
    run: [scene.living_room_dinner, script.dining_music]   # a list runs in order
    dynamic: true                 # changes its lights itself, so only switching off ends it
  - name: Party
    icon: mdi:party-popper
    run: script.party_mode
    active_entity: input_select.living_room_mode   # lit while this entity says so
    active_state: Party           # default "on"; for a select, the moment's name`,
      },
    ],
  },
  {
    id: "house",
    title: "House-wide cards",
    lede: "Cards for a Home or Now view: what's happening, what needs you, and what's next.",
    specs: [
      {
        id: "header",
        type: "moments-header",
        blurb: "A greeting, the time, the weather and the indoor temperature, plus \"dark outside\" from a light sensor. Updates every minute.",
        needs: "A weather entity (optional)",
        cols: 1,
        width: 760,
        yaml: `type: custom:moments-header
weather_entity: weather.home
temperature_entity: sensor.hallway_temperature
time_of_day_entity: input_select.time_of_day   # morning | day | evening | night; else the clock decides
illuminance_entity: sensor.outdoor_illuminance  # adds "dark outside"
dark_below: 50                    # lx
area: living_room                 # optional area label
# areas_by_user:                  # or an area label per HA user id
#   8f2c1d…: office
schedules_path: schedules         # clock icon opening this view`,
      },
      {
        id: "chips",
        type: "moments-chips",
        blurb: "Alerts only when something needs you: open doors and windows, problem, leak, smoke and gas sensors, low batteries, finished appliances and schedules left off. Shows nothing when all is well.",
        needs: "Nothing",
        cols: 1,
        width: 760,
        yaml: `type: custom:moments-chips
battery_threshold: 15             # percent; batteries below this get a chip
exclude:                          # entities that never get a chip
  - binary_sensor.front_door
finished:                         # appliances that get a chip when they finish
  - entity: sensor.dryer_status
    state: finished
    name: Dryer
schedules:                        # schedules that get a chip when left off…
  - name: Heating boost
    automation: automation.schedule_heating_boost
    time_entity: input_datetime.heating_boost_time
schedules_off_after_hours: 24     # …for longer than this`,
      },
      {
        id: "on-now",
        type: "moments-on-now",
        blurb: "Everything that is on or open, with one-tap off and All lights off. Long lists group by area.",
        needs: "Nothing",
        cols: 1,
        width: 520,
        yaml: `type: custom:moments-on-now
domains: [light, switch, fan, cover]   # which kinds of entity to list
exclude:
  - switch.fridge
groups:                           # areas listed together under one name
  - name: Outside
    icon: mdi:flower
    areas: [garden]
    show_on_now: true`,
      },
      {
        id: "schedules",
        type: "moments-schedules",
        blurb: "Scheduled automations you can adjust in place: on or off, the time, the days, or a sunset offset. The summary form is one quiet line linking to the full list.",
        needs: "An automation plus input helpers per schedule",
        cols: 2,
        yaml: `type: grid
cards:
  - type: custom:moments-schedules
    all: true                     # or area: bedroom; without either, house-level ones only
    schedules:
      - name: Wake up
        icon: mdi:alarm
        automation: automation.schedule_wake_up   # its on/off state enables the schedule
        time_entity: input_datetime.wake_up_time
        days_entities:            # one input_boolean per weekday, Monday first
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
        sun: sunset               # sunrise | sunset instead of a time
        offset_entity: input_number.outside_lights_offset   # minutes
      - name: Coffee
        icon: mdi:coffee
        automation: automation.schedule_coffee
        time_entity: input_datetime.coffee_time

  # One line ("2 schedules · next 06:45") that opens the full list.
  - type: custom:moments-schedules
    area: bedroom
    summary: true
    path: schedules
    schedules:
      - name: Wake up
        automation: automation.schedule_wake_up
        time_entity: input_datetime.wake_up_time
        area: bedroom`,
      },
    ],
  },
  {
    id: "outdoors",
    title: "Weather, climate and network",
    lede: "Charts and logs read Home Assistant's history, which keeps 10 days by default.",
    specs: [
      {
        id: "weather",
        type: "moments-weather",
        blurb: "Today in detail, then the next days: condition, rain in mm, wind and gusts, and a low-to-high bar on one shared scale.",
        needs: "A weather entity with a daily forecast",
        cols: 1,
        width: 520,
        yaml: `type: custom:moments-weather
entity: weather.home
days: 7                           # 0–7 days after today
gust_warn: 50                     # gusts at or above this are highlighted (entity's wind unit)`,
      },
      {
        id: "temperatures",
        type: "moments-temperatures",
        blurb: "Indoor and outside temperatures: now, today's range, the trend, and a chart.",
        needs: "Temperature sensors",
        cols: 1,
        width: 760,
        yaml: `type: custom:moments-temperatures
title: Temperatures
outside: sensor.outdoor_temperature
hours: 24                         # chart length; 0 hides the chart
layout: grid                      # grid | row (all side by side, swipe if they don't fit)
indoor:
  - entity: sensor.living_room_temperature
    name: Living room
  - entity: sensor.office_temperature
    name: Office
  - sensor.bedroom_temperature    # a plain id works too`,
      },
      {
        id: "daylight",
        type: "moments-daylight",
        blurb: "Today's outdoor light on a log scale against your dark line, and when it got dark or light. Use the same dark_below as your automations.",
        needs: "An outdoor illuminance sensor",
        cols: 1,
        width: 520,
        yaml: `type: custom:moments-daylight
title: Daylight
entity: sensor.outdoor_illuminance
dark_below: 50                    # lx`,
      },
      {
        id: "internet",
        type: "moments-internet",
        blurb: "Online status, the latest speeds, a chart of download speed, and recent outages.",
        needs: "Ping (online) and Speedtest (speeds) integrations",
        cols: 1,
        width: 520,
        yaml: `type: custom:moments-internet
title: Internet
online: binary_sensor.internet    # a connectivity binary_sensor
download: sensor.speedtest_download
upload: sensor.speedtest_upload
ping: sensor.speedtest_ping
days: 7                           # chart length
outage_days: 30                   # how far back to list outages
max_outages: 5`,
      },
    ],
  },
];

export const THEME_YAML = `# /config/themes/moments.yaml (from the release), then frontend.reload_themes.
moments:
  ha-card-border-radius: "22px"
  moments-icon-style: glow          # glow | crisp, for every tile without icon_style
  moments-tile-surface: glass       # solid | frosted | glass
  modes:
    dark:
      lovelace-background: center / cover no-repeat url("/local/moments/backdrops/mist-dark.svg")
      moments-tile-opacity: "0.55"
      moments-tile-blur: "26"
    light:
      lovelace-background: center / cover no-repeat url("/local/moments/backdrops/mist-light.svg")
      moments-tile-opacity: "0.4"

# Per view, in the dashboard:
views:
  - title: Home
    theme: moments
    # background: center / cover no-repeat url("/local/moments/backdrops/aurora-dark.svg")   # one view only`;

export const COMPOSE_YAML = `# An area view: the same sections in the same order in every area.
views:
  - title: Living room
    path: living_room              # moments-area cards open the view named after their area
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
          - type: custom:moments-tile
            entity: light.living_room_lamp
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
          - type: custom:moments-tile
            entity: binary_sensor.patio_door

# The Home view: one section per floor.
  - title: Home
    path: home
    type: sections
    sections:
      - type: grid
        cards:
          - type: custom:moments-floor-heading
            floor: downstairs
          - type: custom:moments-area
            area: living_room
          - type: custom:moments-area
            area: kitchen`;
