// A made-up home for the design sheet: every card below renders live against it.
const NOW = Date.now();
const MIN = 60000, HOUR = 60 * MIN, DAY = 24 * HOUR;
const iso = (t) => new Date(t).toISOString();
const ago = (m) => iso(NOW - m * MIN);

const svgPhoto = (a, b, c) =>
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient><filter id="f"><feGaussianBlur stdDeviation="18"/></filter></defs><rect width="400" height="240" fill="url(#g)"/><g filter="url(#f)" opacity=".75"><circle cx="300" cy="70" r="60" fill="${c}"/><rect x="40" y="150" width="220" height="70" rx="20" fill="${b}"/><rect x="250" y="130" width="120" height="110" rx="14" fill="${a}"/></g><rect y="180" width="400" height="60" fill="#000" opacity=".18"/></svg>`,
  );

const floors = {
  downstairs: { floor_id: "downstairs", name: "Downstairs", level: 0 },
  upstairs: { floor_id: "upstairs", name: "Upstairs", level: 1 },
  outside: { floor_id: "outside", name: "Outside", level: -1 },
};
const area = (id, name, floor, photo) => ({ area_id: id, name, floor_id: floor, picture: photo });
const areas = {
  living_room: area("living_room", "Living room", "downstairs", svgPhoto("#8a5a3c", "#d9b28c", "#f6d7a7")),
  kitchen: area("kitchen", "Kitchen", "downstairs", svgPhoto("#5f6b5a", "#c9c2b0", "#eadfc8")),
  hallway: area("hallway", "Hallway", "downstairs", svgPhoto("#4b5563", "#a8a29e", "#e7e5e4")),
  office: area("office", "Office", "upstairs", svgPhoto("#2f4858", "#86a8b8", "#d2e4ec")),
  bedroom: area("bedroom", "Bedroom", "upstairs", svgPhoto("#3b3355", "#9c8fb8", "#e3d9f2")),
  bathroom: area("bathroom", "Bathroom", "upstairs", svgPhoto("#35545a", "#a9c7c4", "#e8f3f1")),
  garden: area("garden", "Garden", "outside", svgPhoto("#2f5130", "#8fb47a", "#d8ecc1")),
};

const states = {};
const entities = {};
const add = (id, state, attributes = {}, areaId, t = {}) => {
  states[id] = {
    entity_id: id,
    state: String(state),
    attributes,
    last_changed: t.changed ?? ago(t.mins ?? 90),
    last_updated: t.updated ?? t.changed ?? ago(t.mins ?? 90),
  };
  entities[id] = { entity_id: id, area_id: areaId ?? null };
};
const sensor = (id, v, dc, unit, name, areaId) =>
  add(id, v, { device_class: dc, unit_of_measurement: unit, friendly_name: name, state_class: "measurement" }, areaId);

// When the living room's Movie moment started.
const MOVIE = ago(38);

// ---- Living room
add("light.living_room_ceiling", "on", { friendly_name: "Ceiling", brightness: 92 }, "living_room", { changed: MOVIE });
add("light.living_room_lamp", "on", { friendly_name: "Floor lamp", brightness: 60 }, "living_room", { changed: MOVIE });
add("light.living_room_shelf", "off", { friendly_name: "Shelf" }, "living_room");
sensor("sensor.living_room_temperature", 21.4, "temperature", "°C", "Living room temperature", "living_room");
sensor("sensor.living_room_humidity", 48, "humidity", "%", "Living room humidity", "living_room");
sensor("sensor.living_room_co2", 640, "carbon_dioxide", "ppm", "Living room CO₂", "living_room");
sensor("sensor.living_room_illuminance", 42, "illuminance", "lx", "Living room light", "living_room");
add("binary_sensor.living_room_occupancy", "on", { device_class: "occupancy", friendly_name: "Living room occupancy" }, "living_room", { mins: 34 });
add("cover.living_room_blind", "open", { friendly_name: "Blind", current_position: 60, device_class: "blind" }, "living_room");
add("scene.living_room_natural_light", ago(300), { friendly_name: "Natural light", entity_id: ["light.living_room_ceiling", "light.living_room_lamp", "light.living_room_shelf"] }, "living_room");
add("scene.living_room_movie", MOVIE, { friendly_name: "Movie", entity_id: ["light.living_room_ceiling", "light.living_room_lamp"] }, "living_room");
add("scene.living_room_reading", ago(2000), { friendly_name: "Reading", entity_id: ["light.living_room_lamp"] }, "living_room");
add("scene.living_room_dinner", ago(1500), { friendly_name: "Dinner", entity_id: ["light.living_room_ceiling", "light.living_room_shelf"], is_dynamic: true }, "living_room");
add("script.dining_music", "off", { friendly_name: "Dining music", last_triggered: ago(1500) });
add("script.party_mode", "off", { friendly_name: "Party mode", last_triggered: ago(9000) });
add("input_select.living_room_mode", "Normal", { friendly_name: "Living room mode", options: ["Normal", "Party"] });
add("media_player.living_room_tv", "playing", { friendly_name: "TV" }, "living_room");

// ---- Kitchen
add("light.kitchen", "on", { friendly_name: "Kitchen", brightness: 230 }, "kitchen", { mins: 70 });
add("light.kitchen_island", "off", { friendly_name: "Island" }, "kitchen");
sensor("sensor.kitchen_temperature", 20.9, "temperature", "°C", "Kitchen temperature", "kitchen");
sensor("sensor.kitchen_humidity", 55, "humidity", "%", "Kitchen humidity", "kitchen");
add("binary_sensor.kitchen_motion", "off", { device_class: "motion", friendly_name: "Kitchen motion" }, "kitchen", { mins: 125 });
add("switch.coffee_machine", "on", { friendly_name: "Coffee machine" }, "kitchen", { mins: 6 });
sensor("sensor.coffee_machine_power", 1240, "power", "W", "Coffee machine power", "kitchen");
sensor("sensor.coffee_machine_energy_today", 0.42, "energy", "kWh", "Coffee machine energy", "kitchen");
add("switch.fridge", "on", { friendly_name: "Fridge plug" }, "kitchen");
add("binary_sensor.fridge_door", "off", { device_class: "door", friendly_name: "Fridge door" }, "kitchen");
sensor("sensor.freezer_temperature", -18.5, "temperature", "°C", "Freezer", "kitchen");
// Dishwasher (Home Connect names)
add("sensor.dishwasher_operation_state", "Run", { friendly_name: "Dishwasher" }, "kitchen", { mins: 72 });
add("sensor.dishwasher_program", "Eco 50°", { friendly_name: "Programme" }, "kitchen");
add("select.dishwasher_active_program", "Eco50", { friendly_name: "Active programme", options: ["Eco50", "Auto2", "Quick45", "Intensiv70"] }, "kitchen");
sensor("sensor.dishwasher_program_progress", 62, null, "%", "Programme progress", "kitchen");
add("sensor.dishwasher_program_finish_time", iso(NOW + 48 * MIN), { device_class: "timestamp", friendly_name: "Finish time" }, "kitchen");
add("sensor.dishwasher_door", "Closed", { friendly_name: "Dishwasher door" }, "kitchen");
sensor("sensor.dishwasher_plug_energy", 812.4, "energy", "kWh", "Dishwasher energy", "kitchen");

// ---- Hallway
add("climate.hallway", "heat", { friendly_name: "Heating", hvac_action: "heating", current_temperature: 20.5, temperature: 21 }, "hallway");
add("lock.front_door", "locked", { friendly_name: "Front door" }, "hallway");
add("lock.back_door", "unlocked", { friendly_name: "Back door" }, "hallway");
add("binary_sensor.front_door", "off", { device_class: "door", friendly_name: "Front door" }, "hallway");
add("binary_sensor.patio_door", "on", { device_class: "door", friendly_name: "Patio door" }, "living_room", { mins: 14 });
add("binary_sensor.hall_motion", "on", { device_class: "motion", friendly_name: "Hall motion" }, "hallway", { mins: 1 });
sensor("sensor.hall_motion_battery", 9, "battery", "%", "Hall motion battery", "hallway");
sensor("sensor.hallway_temperature", 20.6, "temperature", "°C", "Hallway temperature", "hallway");

// ---- Office
add("light.office_desk", "on", { friendly_name: "Desk", brightness: 200 }, "office", { mins: 50 });
add("light.office_ceiling", "off", { friendly_name: "Ceiling" }, "office");
sensor("sensor.office_temperature", 22.8, "temperature", "°C", "Office temperature", "office");
sensor("sensor.office_humidity", 41, "humidity", "%", "Office humidity", "office");
sensor("sensor.office_co2", 1180, "carbon_dioxide", "ppm", "Office CO₂", "office");
sensor("sensor.office_illuminance", 310, "illuminance", "lx", "Office light", "office");
add("binary_sensor.office_occupancy", "on", { device_class: "occupancy", friendly_name: "Office occupancy" }, "office", { mins: 52 });
add("cover.office_blind", "open", { friendly_name: "Office blind", current_position: 30, device_class: "blind" }, "office");
add("fan.office", "on", { friendly_name: "Desk fan" }, "office", { mins: 20 });

// ---- Bedroom
add("light.bedroom", "off", { friendly_name: "Bedroom" }, "bedroom");
add("light.bedroom_bedside", "on", { friendly_name: "Bedside", brightness: 40 }, "bedroom", { mins: 15 });
sensor("sensor.bedroom_temperature", 18.6, "temperature", "°C", "Bedroom temperature", "bedroom");
sensor("sensor.bedroom_humidity", 52, "humidity", "%", "Bedroom humidity", "bedroom");
add("binary_sensor.bedroom_presence", "off", { device_class: "presence", friendly_name: "Bedroom presence" }, "bedroom", { mins: 190 });
add("cover.bedroom_blind", "closing", { friendly_name: "Bedroom blind", device_class: "blind" }, "bedroom");

// ---- Bathroom
add("light.bathroom", "off", { friendly_name: "Bathroom" }, "bathroom");
sensor("sensor.bathroom_temperature", 21.9, "temperature", "°C", "Bathroom temperature", "bathroom");
sensor("sensor.bathroom_humidity", 71, "humidity", "%", "Bathroom humidity", "bathroom");
add("binary_sensor.bathroom_leak", "on", { device_class: "moisture", friendly_name: "Bathroom leak" }, "bathroom", { mins: 3 });
add("binary_sensor.bathroom_motion", "off", { device_class: "motion", friendly_name: "Bathroom motion" }, "bathroom", { mins: 45 });

// ---- Utility (no area)
add("sensor.washer_status", "run", { friendly_name: "Washer" });
sensor("sensor.washer_progress", 35, null, "%", "Washer progress");
add("sensor.dryer_status", "finished", { friendly_name: "Dryer" }, null, { mins: 25 });

// ---- Garden and outdoors
add("light.garden_path", "on", { friendly_name: "Garden path", brightness: 150 }, "garden", { mins: 80 });
add("switch.garden_fountain", "on", { friendly_name: "Fountain" }, "garden", { mins: 200 });
// Outdoor light follows a daylight curve for the viewer's own clock.
const luxAt = (t) => {
  const d = new Date(t);
  const h = d.getHours() + d.getMinutes() / 60;
  const s = Math.sin(((h - 7) / 10) * Math.PI);
  return s <= 0 ? 0.4 : Math.max(0.4, 18000 * s ** 2.2);
};
const tempAt = (t, base, amp) => base + amp * Math.sin(((new Date(t).getHours() - 9) / 24) * 2 * Math.PI) + 0.25 * Math.sin(t / 2.3e6);
sensor("sensor.outdoor_temperature", tempAt(NOW, 8, 3.5).toFixed(1), "temperature", "°C", "Outside", "garden");
sensor("sensor.outdoor_illuminance", Math.round(luxAt(NOW)), "illuminance", "lx", "Outdoor light", "garden");

add("weather.home", "partlycloudy", {
  friendly_name: "Home",
  temperature: Number(tempAt(NOW, 8, 3.5).toFixed(1)),
  humidity: 76,
  wind_speed: 18,
  wind_gust_speed: 41,
  wind_speed_unit: "km/h",
  temperature_unit: "°C",
  precipitation_unit: "mm",
  supported_features: 1,
});
const sunrise = new Date(NOW); sunrise.setHours(7, 24, 0, 0); if (sunrise.getTime() < NOW) sunrise.setDate(sunrise.getDate() + 1);
const sunset = new Date(NOW); sunset.setHours(16, 21, 0, 0); if (sunset.getTime() < NOW) sunset.setDate(sunset.getDate() + 1);
add("sun.sun", NOW > new Date().setHours(7, 24) && NOW < new Date().setHours(16, 21) ? "above_horizon" : "below_horizon", { next_rising: iso(sunrise), next_setting: iso(sunset) });
const hr = new Date(NOW).getHours();
add("input_select.time_of_day", hr < 5 || hr >= 22 ? "night" : hr < 11 ? "morning" : hr < 17 ? "day" : "evening", { options: ["morning", "day", "evening", "night"] });

// ---- Internet
add("binary_sensor.internet", "on", { device_class: "connectivity", friendly_name: "Internet" }, null, { mins: 2.2 * 24 * 60 - 6 });
sensor("sensor.speedtest_download", 412.6, "data_rate", "Mbit/s", "Download");
sensor("sensor.speedtest_upload", 48.2, "data_rate", "Mbit/s", "Upload");
sensor("sensor.speedtest_ping", 11, "duration", "ms", "Ping");

// ---- Schedules
const time = (id, hh, mm, name) => add(id, `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`, { has_date: false, has_time: true, hour: hh, minute: mm, friendly_name: name });
add("automation.schedule_wake_up", "on", { friendly_name: "Wake up", last_triggered: ago(700) });
time("input_datetime.wake_up_time", 6, 45, "Wake up time");
["mon", "tue", "wed", "thu", "fri", "sat", "sun"].forEach((d, i) => add(`input_boolean.wake_up_${d}`, i < 5 ? "on" : "off", { friendly_name: `Wake up ${d}` }));
add("automation.schedule_outside_lights_on", "on", { friendly_name: "Outside lights on", last_triggered: ago(1300) });
add("input_number.outside_lights_offset", "-15", { min: -120, max: 120, step: 5, friendly_name: "Offset" });
add("automation.schedule_coffee", "on", { friendly_name: "Coffee", last_triggered: ago(800) });
time("input_datetime.coffee_time", 6, 30, "Coffee time");
add("automation.schedule_heating_boost", "off", { friendly_name: "Heating boost" }, null, { mins: 3 * 24 * 60 });
time("input_datetime.heating_boost_time", 17, 0, "Heating boost time");

export const AREAS = areas;
export const FLOORS = floors;

// ---- History: plausible series for charts, logs and sparklines.
const series = (start, stepMin, fn) => {
  const out = [];
  for (let t = start; t <= NOW; t += stepMin * MIN) out.push({ s: String(fn(t)), lu: t / 1000 });
  return out;
};
const steps = (pairs) => pairs.map(([t, s]) => ({ s, lu: t / 1000 }));
const histories = {
  "sensor.outdoor_illuminance": (st) => series(st, 10, (t) => Math.round(luxAt(t))),
  "sensor.outdoor_temperature": (st) => series(st, 20, (t) => tempAt(t, 8, 3.5).toFixed(1)),
  "sensor.speedtest_download": (st) => series(st, 60, (t) => (395 + 30 * Math.sin(t / 3.1e7) + 18 * Math.sin(t / 4.7e6) - (Math.abs(t - (NOW - 2.2 * DAY)) < 3 * HOUR ? 170 : 0)).toFixed(1)),
  "sensor.speedtest_upload": (st) => series(st, 60, (t) => (46 + 3 * Math.sin(t / 5e6)).toFixed(1)),
  "sensor.speedtest_ping": (st) => series(st, 60, (t) => Math.round(11 + 3 * Math.sin(t / 3e6))),
  "binary_sensor.internet": (st) =>
    steps([
      [st, "on"],
      [NOW - 2.2 * DAY, "off"], [NOW - 2.2 * DAY + 6 * MIN, "on"],
      [NOW - 6.4 * DAY, "off"], [NOW - 6.4 * DAY + 41 * MIN, "on"],
      [NOW - 13 * DAY, "off"], [NOW - 13 * DAY + 3 * MIN, "on"],
    ].filter(([t]) => t >= st).sort((a, b) => a[0] - b[0])),
  "sensor.dishwasher_operation_state": (st) => {
    const pts = [[st, "Ready"]];
    for (const d of [1, 2, 4, 5, 7, 9, 11, 13]) {
      const s = NOW - d * DAY - 2 * HOUR;
      if (s < st) continue;
      pts.push([s, "Run"], [s + (d % 2 ? 3.3 : 0.75) * HOUR, "Finished"], [s + 4 * HOUR, "Ready"]);
    }
    pts.push([NOW - 72 * MIN, "Run"]);
    return steps(pts.sort((a, b) => a[0] - b[0]));
  },
  "select.dishwasher_active_program": (st) => {
    const pts = [[st, "Eco50"]];
    for (const d of [1, 2, 4, 5, 7, 9, 11, 13]) {
      const s = NOW - d * DAY - 2 * HOUR - MIN;
      if (s >= st) pts.push([s, d % 2 ? "Eco50" : "Quick45"]);
    }
    pts.push([NOW - 73 * MIN, "Eco50"]);
    return steps(pts.sort((a, b) => a[0] - b[0]));
  },
  "sensor.dishwasher_plug_energy": (st) => {
    let e = 800;
    return series(st, 30, (t) => {
      const running = [1, 2, 4, 5, 7, 9, 11, 13].some((d) => { const s = NOW - d * DAY - 2 * HOUR; return t > s && t < s + (d % 2 ? 3.3 : 0.75) * HOUR; });
      if (running) e += 0.12;
      return e.toFixed(2);
    });
  },
};
const smooth = (id, st) => {
  const e = states[id];
  const v = Number(e?.state);
  if (!Number.isFinite(v)) return [{ s: e?.state ?? "unknown", lu: st / 1000 }];
  const dc = e.attributes.device_class;
  const amp = dc === "temperature" ? 1.2 : dc === "carbon_dioxide" ? 260 : dc === "humidity" ? 6 : dc === "illuminance" ? v * 0.5 : v * 0.05;
  const seed = id.length;
  const pts = series(st, 20, (t) => {
    const x = (t - NOW) / HOUR;
    const w = amp * (Math.sin(x / 3.5 + seed) * 0.6 + Math.sin(x / 1.3 + seed * 2) * 0.25) * (dc === "carbon_dioxide" ? 1 : 1);
    return (v + w - (dc === "carbon_dioxide" ? amp * 0.4 * (x / 24) : 0)).toFixed(dc === "temperature" ? 1 : 0);
  });
  pts.push({ s: e.state, lu: NOW / 1000 });
  return pts;
};
export const history = (ids, start) => {
  const st = Math.max(Date.parse(start), NOW - 31 * DAY);
  const out = {};
  for (const id of ids) out[id] = (histories[id] ?? ((s) => smooth(id, s)))(st);
  return out;
};

export const forecast = () => {
  const conds = ["partlycloudy", "rainy", "pouring", "cloudy", "sunny", "partlycloudy", "windy", "rainy"];
  const out = [];
  const d0 = new Date(NOW); d0.setHours(12, 0, 0, 0);
  for (let i = 0; i < 8; i++) {
    out.push({
      datetime: iso(d0.getTime() + i * DAY),
      condition: conds[i],
      temperature: [11, 9, 8, 10, 12, 13, 11, 9][i],
      templow: [4, 5, 3, 2, 4, 6, 5, 3][i],
      precipitation: [0.4, 6.2, 14.8, 1.1, 0, 0, 2.3, 7.5][i],
      precipitation_probability: [20, 80, 95, 40, 5, 10, 55, 85][i],
      wind_speed: [18, 24, 31, 15, 9, 12, 38, 22][i],
      wind_gust_speed: [41, 48, 62, 30, 20, 25, 71, 44][i],
    });
  }
  return out;
};

// ---- Services: enough for chips, switches and toggles to respond on the sheet.
export const makeHass = (onChange) => {
  const touch = (id, state, attrs = {}) => {
    const e = states[id];
    if (!e) return;
    const t = iso(Date.now());
    const changed = state !== undefined && state !== e.state;
    states[id] = { ...e, state: state ?? e.state, attributes: { ...e.attributes, ...attrs }, last_changed: changed ? t : e.last_changed, last_updated: t };
  };
  const ids = (data) => [].concat(data?.entity_id ?? []);
  const run = (domain, service, data) => {
    for (const id of ids(data)) {
      const d = id.split(".")[0];
      const e = states[id];
      if (!e) continue;
      if (d === "scene") {
        touch(id, iso(Date.now()));
        for (const l of e.attributes.entity_id ?? []) touch(l, "on", { brightness: 160 });
      } else if (d === "script") {
        touch(id, service === "turn_off" ? "off" : "on", { last_triggered: iso(Date.now()) });
        if (service !== "turn_off") setTimeout(() => { touch(id, "off"); onChange(); }, 4000);
      } else if (d === "lock") touch(id, service === "lock" ? "locked" : "unlocked");
      else if (d === "cover") {
        const pos = service === "open_cover" ? 100 : service === "close_cover" ? 0 : data.position ?? e.attributes.current_position;
        touch(id, pos > 0 ? "open" : "closed", { current_position: pos });
      } else if (service === "toggle") touch(id, e.state === "on" ? "off" : "on");
      else if (service === "turn_on") touch(id, "on", d === "light" ? { brightness: e.attributes.brightness ?? 200 } : {});
      else if (service === "turn_off") touch(id, "off");
      else if (domain === "input_datetime" && data.time) {
        const [hh, mm] = data.time.split(":").map(Number);
        touch(id, `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}:00`, { hour: hh, minute: mm });
      } else if (domain === "input_number" && data.value !== undefined) touch(id, String(data.value));
    }
  };
  const base = {
    entities,
    devices: {},
    areas,
    floors,
    user: { id: "user_demo", name: "Sam", is_admin: true },
    locale: { language: "en-GB", time_format: "24" },
    config: { time_zone: Intl.DateTimeFormat().resolvedOptions().timeZone, unit_system: { temperature: "°C" } },
    callService: async (domain, service, data) => {
      run(domain, service, data);
      onChange();
    },
    callWS: async (msg) => (msg.type === "history/history_during_period" ? history(msg.entity_ids, msg.start_time) : {}),
    connection: {
      subscribeMessage: async (cb, msg) => {
        if (msg.type === "weather/subscribe_forecast") setTimeout(() => cb({ type: "daily", forecast: forecast() }), 0);
        return () => {};
      },
    },
  };
  return (dark) => ({ ...base, states: { ...states }, themes: { darkMode: dark } });
};
