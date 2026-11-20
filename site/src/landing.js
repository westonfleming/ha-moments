// The home page: a tablet showing an area view and a phone showing the Home view,
// both built from the real cards against the sample home. Tap around: it all responds.
import { ICONS, ICON_CSS } from "../../src/icons/generated";
import { tintFor } from "../../src/icons/resolve";
import { $, $$, esc, createCard, currentHass, pushHass, onTheme, backdropUrl, start, defineSheetIcon, getIconStyle } from "./common.js";
import { mountDemos } from "./demos.js";
import { AREAS, FLOORS } from "./mock-home.js";

defineSheetIcon(ICONS, ICON_CSS);

const MOMENTS = {
  living_room: {
    default: { name: "Natural", icon: "mdi:weather-sunny", run: "scene.living_room_natural_light" },
    moments: [
      { name: "Movie", icon: "mdi:movie-open", run: "scene.living_room_movie" },
      { name: "Reading", icon: "mdi:book-open-variant", run: "scene.living_room_reading", lights: ["light.living_room_lamp"] },
      { name: "Dinner", icon: "mdi:silverware-fork-knife", run: ["scene.living_room_dinner", "script.dining_music"], dynamic: true },
    ],
  },
};

const domain = (id) => id.split(".")[0];

/** An area view, built the same way for every area: header, lighting, climate & air, windows & doors, devices. */
const areaView = (areaId) => {
  const h = currentHass();
  const ids = Object.keys(h.states).filter((id) => h.entities[id]?.area_id === areaId);
  const dc = (id) => h.states[id].attributes.device_class;
  const pick = (fn) => ids.filter(fn);
  const lights = pick((id) => domain(id) === "light");
  const climate = pick((id) => domain(id) === "climate");
  const metrics = pick((id) => domain(id) === "sensor" && ["temperature", "humidity", "carbon_dioxide"].includes(dc(id)) && !/freezer/.test(id));
  const openings = pick((id) => domain(id) === "cover" || domain(id) === "lock" || (domain(id) === "binary_sensor" && ["door", "window"].includes(dc(id)) && !/fridge/.test(id)));
  const devices = pick((id) => ["switch", "fan", "media_player"].includes(domain(id)) && !/fridge/.test(id));
  const tile = (entity, extra = {}) => ({ type: "custom:moments-tile", entity, ...extra });
  const sections = [];
  if (lights.length)
    sections.push({
      title: "Lighting",
      cards: [
        ...lights.map((e) => tile(e, { tap_action: "toggle" })),
        ...(MOMENTS[areaId] ? [{ type: "custom:moments-area-moments", area: areaId, ...MOMENTS[areaId] }] : []),
      ],
    });
  if (climate.length || metrics.length)
    sections.push({ title: "Climate & air", cards: [...climate.map((e) => tile(e)), ...metrics.map((entity) => ({ type: "custom:moments-metric", entity }))] });
  if (openings.length)
    sections.push({ title: "Windows & doors", cards: openings.map((e) => tile(e, domain(e) === "cover" ? { progress: "position" } : domain(e) === "lock" ? { tap_action: "toggle" } : {})) });
  const appliances = areaId === "kitchen"
    ? [tile("sensor.dishwasher_operation_state", { icon_set: "dishwasher", name: "Dishwasher", states: { running: ["Run"], on: ["Ready", "Finished"] }, secondary: "sensor.dishwasher_program", progress: "sensor.dishwasher_program_progress", finish: "sensor.dishwasher_program_finish_time" })]
    : [];
  if (devices.length || appliances.length)
    sections.push({
      title: "Devices",
      cards: [
        ...appliances,
        ...devices.map((e) =>
          e === "switch.coffee_machine"
            ? tile(e, { icon_set: "coffee", states: { brewing: ["on"] }, metrics: ["sensor.coffee_machine_power"], tap_action: "toggle" })
            : tile(e, { tap_action: "toggle" }),
        ),
      ],
    });
  return sections;
};

// ---- Tablet: an area view with view tabs, like a Home Assistant dashboard.
const tabletAreas = ["living_room", "kitchen", "hallway", "office", "bedroom", "bathroom", "garden"];
let currentArea = "living_room";

const renderTablet = (areaId = currentArea) => {
  currentArea = areaId;
  const screen = $("#tablet-view");
  for (const t of $$("#tablet-tabs button")) t.setAttribute("aria-selected", String(t.dataset.area === areaId));
  const body = document.createElement("div");
  body.className = "view-body";
  const head = document.createElement("div");
  head.className = "view-head";
  head.append(createCard({ type: "custom:moments-area-header", area: areaId }));
  const cols = document.createElement("div");
  cols.className = "view-sections";
  for (const sec of areaView(areaId)) {
    const s = document.createElement("div");
    s.className = "view-section";
    s.innerHTML = `<h4 class="view-heading">${esc(sec.title)}</h4>`;
    const grid = document.createElement("div");
    grid.className = "view-grid";
    for (const c of sec.cards) {
      const el = createCard(c);
      const wide = c.type.endsWith("area-moments") || c.progress || c.finish;
      const slot = document.createElement("div");
      slot.className = "slot" + (wide ? " span2" : "");
      slot.append(el);
      grid.append(slot);
    }
    s.append(grid);
    cols.append(s);
  }
  body.append(head, cols);
  screen.replaceChildren(body);
};

const buildTabletTabs = () => {
  const tabs = $("#tablet-tabs");
  tabs.innerHTML = tabletAreas.map((a) => `<button type="button" role="tab" data-area="${a}">${esc(AREAS[a].name)}</button>`).join("");
  for (const b of $$("button", tabs)) b.addEventListener("click", () => renderTablet(b.dataset.area));
};

// ---- Phone: the Home view, areas grouped by floor.
const renderPhone = () => {
  const host = $("#phone-view");
  const body = document.createElement("div");
  body.className = "view-body phone-body";
  const add = (cfg, cls = "") => {
    const slot = document.createElement("div");
    slot.className = "slot " + cls;
    slot.append(createCard(cfg));
    body.append(slot);
  };
  add({ type: "custom:moments-header", weather_entity: "weather.home", temperature_entity: "sensor.hallway_temperature", illuminance_entity: "sensor.outdoor_illuminance", time_of_day_entity: "input_select.time_of_day" });
  add({ type: "custom:moments-chips", exclude: ["binary_sensor.front_door"] });
  for (const f of Object.values(FLOORS).sort((a, b) => (a.level < 0 ? 9 : a.level) - (b.level < 0 ? 9 : b.level))) {
    add({ type: "custom:moments-floor-heading", floor: f.floor_id }, "floor");
    for (const a of Object.values(AREAS).filter((x) => x.floor_id === f.floor_id)) add({ type: "custom:moments-area", area: a.area_id });
  }
  host.replaceChildren(body);
};

// Area cards navigate to the view named after their area: show it on the tablet.
window.addEventListener("moments-navigate", (e) => {
  const id = String(e.detail.path).split("/").filter(Boolean).pop();
  if (AREAS[id] && tabletAreas.includes(id)) {
    renderTablet(id);
    $("#tablet").classList.remove("pulse");
    void $("#tablet").offsetWidth;
    $("#tablet").classList.add("pulse");
  }
});

// ---- Screens render at their real size, scaled to fit.
const fit = () => {
  for (const scr of $$(".screen")) {
    const vp = $(".viewport", scr);
    const w = Number(vp.dataset.w);
    const s = scr.clientWidth / w;
    vp.style.transform = `scale(${s})`;
    scr.style.height = `${Number(vp.dataset.h) * s}px`;
  }
};
new ResizeObserver(fit).observe(document.body);

// ---- Controls under the devices.
let backdrop = "aurora";
const applyBackdrop = () => {
  const url = backdropUrl(backdrop);
  for (const v of $$(".viewport")) v.style.backgroundImage = backdrop === "none" ? "none" : `url("${url}")`;
  $(".hero-bg").style.backgroundImage = backdrop === "none" ? "none" : `url("${url}")`;
  for (const b of $$("[data-backdrop]")) b.setAttribute("aria-pressed", String(b.dataset.backdrop === backdrop));
};
const setSurface = (s) => {
  for (const v of $$(".viewport")) v.style.setProperty("--moments-tile-surface", s);
  for (const b of $$("[data-surface]")) b.setAttribute("aria-pressed", String(b.dataset.surface === s));
  // Surfaces are read when a card renders, so draw the views again.
  renderTablet();
  renderPhone();
};

// ---- The icon strip.
const STRIP = [
  ["light", "on"], ["washer", "running"], ["fan", "on"], ["vacuum", "cleaning"], ["blind", "60"], ["garage", "opening"],
  ["thermostat", "heat"], ["speaker", "playing"], ["coffee", "brewing"], ["mower", "mowing"], ["lock", "jammed"], ["leak", "wet"],
  ["dishwasher", "running"], ["humidifier", "humidifying"], ["alarm", "armed_night"], ["tv", "playing"],
];
const renderStrip = () => {
  $("#icon-strip").innerHTML = STRIP.map(([set, st]) => {
    const tint = tintFor(set, st);
    return `<li><div class="badge"${tint ? ` style="--tint:${tint}"` : ""}><sheet-icon set="${set}" state="${st}" icon-style="${getIconStyle()}"></sheet-icon></div><span>${esc(set.replace("_", " "))}</span></li>`;
  }).join("");
};

buildTabletTabs();
renderTablet();
renderPhone();
renderStrip();
mountDemos();
for (const b of $$("[data-backdrop]")) b.addEventListener("click", () => { backdrop = b.dataset.backdrop; applyBackdrop(); });
for (const b of $$("[data-surface]")) b.addEventListener("click", () => setSurface(b.dataset.surface));
onTheme(applyBackdrop);
start();
setSurface("glass");
applyBackdrop();
fit();
pushHass();
