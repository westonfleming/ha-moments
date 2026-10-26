import { describe, expect, it } from "vitest";
import { MomentsDashboardStrategy } from "../src/strategy/moments-dashboard-strategy";
import { defaultIntents, mediaPlayers, nowView } from "../src/strategy/now-view";
import { areaEntities, areaGroups, areaSection, roomsView, tileFeatures } from "../src/strategy/rooms-view";
import { schedulesView } from "../src/strategy/schedules-view";
import type { MomentsStrategyConfig } from "../src/config";
import { fakeHass } from "./fake-hass";

const base: MomentsStrategyConfig = { type: "custom:moments" };

const home = () =>
  fakeHass(
    {
      "light.lounge": ["off", { friendly_name: "Lounge lamp", supported_color_modes: ["brightness"] }],
      "light.lounge_strip": ["on", { friendly_name: "Accent strip", supported_color_modes: ["onoff"] }],
      "cover.lounge": ["open", { friendly_name: "Blind" }],
      "climate.lounge": ["heat", { friendly_name: "Heater" }],
      "media_player.lounge": ["playing", { friendly_name: "TV" }],
      "switch.lounge_fan": ["off", { friendly_name: "Fan plug" }],
      "sensor.lounge_temp": ["21", {}],
      "light.kitchen": ["on", { friendly_name: "Kitchen" }],
      "light.hall": ["on", { friendly_name: "Hall" }],
      "light.garden": ["on", { friendly_name: "Garden" }],
      "light.hidden": ["on", {}],
      "media_player.hidden": ["playing", {}],
      "media_player.office": ["idle", {}],
      "scene.relax": "unknown",
      "scene.cook": "unknown",
      "scene.hidden": "unknown",
      "weather.home": "sunny",
    },
    {
      areas: {
        lounge: { area_id: "lounge", name: "Lounge", floor_id: "ground", icon: "mdi:sofa" },
        kitchen: { area_id: "kitchen", name: "Kitchen", floor_id: "ground" },
        hall: { area_id: "hall", name: "Hall", floor_id: "first" },
        garden: { area_id: "garden", name: "Garden" },
        empty: { area_id: "empty", name: "Attic", floor_id: "first" },
      },
      floors: {
        first: { floor_id: "first", name: "First floor", level: 1 },
        ground: { floor_id: "ground", name: "Ground floor", level: 0 },
      },
      devices: { tv: { id: "tv", area_id: "lounge" } },
      entities: {
        "light.lounge": { entity_id: "light.lounge", area_id: "lounge" },
        "light.lounge_strip": { entity_id: "light.lounge_strip", area_id: "lounge" },
        "cover.lounge": { entity_id: "cover.lounge", area_id: "lounge" },
        "climate.lounge": { entity_id: "climate.lounge", area_id: "lounge" },
        "media_player.lounge": { entity_id: "media_player.lounge", device_id: "tv" },
        "switch.lounge_fan": { entity_id: "switch.lounge_fan", area_id: "lounge" },
        "sensor.lounge_temp": { entity_id: "sensor.lounge_temp", area_id: "lounge" },
        "light.kitchen": { entity_id: "light.kitchen", area_id: "kitchen" },
        "light.hall": { entity_id: "light.hall", area_id: "hall" },
        "light.garden": { entity_id: "light.garden", area_id: "garden" },
        "light.hidden": { entity_id: "light.hidden", area_id: "kitchen", hidden: true },
        "media_player.hidden": { entity_id: "media_player.hidden", hidden: true },
        "scene.hidden": { entity_id: "scene.hidden", hidden: true },
      },
    },
  );

const types = (section: any) => section.cards.map((c: any) => c.type);

describe("generate", () => {
  it("stays static async and returns title and views", async () => {
    const out = await MomentsDashboardStrategy.generate(base, home());
    expect(out.title).toBe("Moments");
    expect(out.views.map((v: any) => v.path)).toEqual(["now", "rooms"]);
  });
  it("adds a schedules subview only with schedules", async () => {
    const out = await MomentsDashboardStrategy.generate(
      { ...base, schedules: [{ name: "Wake", automation: "automation.wake" }] },
      home(),
    );
    const view: any = out.views[2];
    expect(view).toMatchObject({ path: "schedules", subview: true });
    expect(view.sections[0].cards).toEqual([
      { type: "custom:moments-schedules", schedules: [{ name: "Wake", automation: "automation.wake" }], all: true },
    ]);
    expect(schedulesView({ ...base, schedules: [] })).toBeUndefined();
  });
});

describe("Now view", () => {
  it("defaults to the first 8 visible scenes", () => {
    expect(defaultIntents(base, home())).toEqual([{ entity: "scene.relax" }, { entity: "scene.cook" }]);
    expect(defaultIntents({ ...base, intents: [] }, home())).toEqual([]);
  });

  it("filters media players by config and visibility", () => {
    expect(mediaPlayers(base, home())).toEqual(["media_player.lounge", "media_player.office"]);
    expect(mediaPlayers({ ...base, media_players: ["media_player.office", "media_player.gone"] }, home())).toEqual([
      "media_player.office",
    ]);
  });

  it("stacks header, intents, on now, media without a room mapping", () => {
    const view = nowView(base, home());
    expect(view.max_columns).toBe(2);
    const [header, intents, onNow, media] = view.sections;
    expect(view.sections).toHaveLength(4);
    expect(header.column_span).toBe(2);
    expect(types(header)).toEqual(["custom:moments-header", "custom:moments-chips"]);
    expect(header.cards[0]).toEqual({ type: "custom:moments-header", weather_entity: "weather.home" });
    expect(header.cards[1]).toEqual({ type: "custom:moments-chips" });
    expect(types(intents)).toEqual(["heading", "custom:moments-intents"]);
    expect(types(onNow)).toEqual(["heading", "custom:moments-on-now"]);
    expect(media.visibility[0].condition).toBe("or");
    expect(media.cards.slice(1).map((c: any) => c.entity)).toEqual(["media_player.lounge", "media_player.office"]);
    expect(media.cards[1].visibility).toEqual([{ condition: "state", entity: "media_player.lounge", state: "playing" }]);
  });

  it("passes header, chips and on-now options through", () => {
    const schedules = [{ name: "Wake", automation: "automation.wake" }];
    const groups = [{ name: "Outside", areas: ["garden"], show_on_now: true }];
    const view = nowView(
      {
        ...base,
        time_of_day_entity: "input_select.tod",
        illuminance_entity: "sensor.lux",
        dark_below: 30,
        temperature_entity: "sensor.lounge_temp",
        rooms_by_user: { u1: "lounge" },
        schedules,
        chips: { battery_threshold: 15 },
        on_now: { domains: ["light"] },
        room_groups: groups,
      },
      home(),
    );
    const [header, , doSomething, onNow] = view.sections;
    expect(header.cards[0]).toEqual({
      type: "custom:moments-header",
      time_of_day_entity: "input_select.tod",
      illuminance_entity: "sensor.lux",
      dark_below: 30,
      weather_entity: "weather.home",
      temperature_entity: "sensor.lounge_temp",
      rooms_by_user: { u1: "lounge" },
      schedules_path: "schedules",
    });
    expect(header.cards[1]).toEqual({ type: "custom:moments-chips", battery_threshold: 15, schedules });
    expect(doSomething.cards[1]).toMatchObject({ dark_below: 30 }); expect(doSomething.cards[1].rooms_by_user).toBeUndefined();
    expect(onNow.cards[1]).toEqual({ type: "custom:moments-on-now", domains: ["light"], groups });
  });

  it("puts a user-scoped This room section right after the header", () => {
    const intents = [
      { entity: "scene.relax", area: "lounge" },
      { entity: "script.movie", areas: ["lounge", "hall"] },
      { entity: "scene.cook" },
    ];
    const view = nowView({ ...base, intents, rooms_by_user: { u1: "lounge", u2: "lounge", u3: "hall" } }, home());
    const [, lounge, hall, doSomething] = view.sections;
    expect(lounge.visibility).toEqual([{ condition: "user", users: ["u1", "u2"] }]);
    expect(lounge.cards[0]).toEqual({ type: "heading", heading: "Lounge", icon: "mdi:sofa" });
    expect(lounge.cards[1]).toEqual({
      type: "custom:moments-intents",
      intents: intents.slice(0, 2),
      area: "lounge",
      include_house: false,
    });
    const tiles = lounge.cards.slice(2);
    expect(tiles.map((t: any) => t.entity)).toEqual([
      "light.lounge_strip",
      "light.lounge",
      "climate.lounge",
      "cover.lounge",
      "media_player.lounge",
    ]);
    expect(tiles[1].features).toEqual([{ type: "light-brightness" }]);
    expect(tiles[0].features).toBeUndefined();
    expect(hall.visibility).toEqual([{ condition: "user", users: ["u3"] }]);
    expect(doSomething.cards[1].intents).toEqual(intents);
  });

  it("omits room intents when the room has none and skips empty rooms", () => {
    const view = nowView({ ...base, intents: [], rooms_by_user: { u1: "kitchen", u2: "empty" } }, home());
    expect(view.sections).toHaveLength(5);
    expect(types(view.sections[1])).toEqual(["heading", "tile"]);
    expect(types(view.sections[2])).toEqual(["heading"]);
  });
});

describe("Rooms view helpers", () => {
  it("orders entities and applies per-area domains and exclude", () => {
    const hass = home();
    expect(areaEntities(hass, base, "lounge")).toEqual([
      "light.lounge_strip",
      "light.lounge",
      "climate.lounge",
      "cover.lounge",
      "media_player.lounge",
      "switch.lounge_fan",
    ]);
    expect(
      areaEntities(hass, { ...base, areas: { lounge: { domains: ["light", "sensor"], exclude: ["light.lounge"] } } }, "lounge"),
    ).toEqual(["light.lounge_strip", "sensor.lounge_temp"]);
    expect(areaEntities(hass, base, "kitchen")).toEqual(["light.kitchen"]);
  });

  it("maps tile features by domain", () => {
    const hass = home();
    expect(tileFeatures(hass, "cover.lounge")).toEqual([{ type: "cover-open-close" }]);
    expect(tileFeatures(hass, "climate.lounge")).toEqual([{ type: "target-temperature" }]);
    expect(tileFeatures(hass, "light.kitchen")).toEqual([{ type: "light-brightness" }]);
    expect(tileFeatures(hass, "switch.lounge_fan")).toEqual([]);
  });

  it("groups by floor level with floorless areas in Other", () => {
    const groups = areaGroups(home(), base);
    expect(groups.map((g) => [g.name, g.areas.map((a) => a.area_id)])).toEqual([
      ["Ground floor", ["kitchen", "lounge"]],
      ["First floor", ["empty", "hall"]],
      ["Other", ["garden"]],
    ]);
  });

  it("uses one ungrouped list without floors, and skips hidden areas", () => {
    const hass = home();
    hass.floors = {};
    const groups = areaGroups(hass, { ...base, hide_areas: ["hall"] });
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBeUndefined();
    expect(groups[0].areas.map((a) => a.area_id)).toEqual(["empty", "garden", "kitchen", "lounge"]);
  });

  it("follows room_groups order and puts the rest in Other", () => {
    const groups = areaGroups(home(), {
      ...base,
      room_groups: [
        { name: "Living", areas: ["lounge", "kitchen", "nope"], icon: "mdi:sofa" },
        { name: "Outside", areas: ["garden"] },
      ],
    });
    expect(groups.map((g) => [g.name, g.areas.map((a) => a.area_id)])).toEqual([
      ["Living", ["lounge", "kitchen"]],
      ["Outside", ["garden"]],
      ["Other", ["empty", "hall"]],
    ]);
    expect(groups[0].icon).toBe("mdi:sofa");
  });

  it("renders compact areas with tiles only and a subtitle heading", () => {
    const hass = home();
    const s: any = areaSection(hass, base, hass.areas.kitchen);
    expect(s.cards).toEqual([
      { type: "heading", heading: "Kitchen", heading_style: "subtitle" },
      { type: "tile", entity: "light.kitchen" },
    ]);
    const forced: any = areaSection(hass, { ...base, areas: { kitchen: { compact: false } } }, hass.areas.kitchen);
    expect(forced.cards[0].heading_style).toBeUndefined();
    expect(forced.cards[1].features).toEqual([{ type: "light-brightness" }]);
    expect(areaSection(hass, base, hass.areas.empty)).toBeUndefined();
  });

  it("renders full areas with intents, featured tiles and a schedule summary", () => {
    const hass = home();
    const schedules = [
      { name: "Blind", automation: "automation.blind", area: "lounge" },
      { name: "Wake", automation: "automation.wake" },
    ];
    const config = { ...base, intents: [{ entity: "scene.relax", area: "lounge" }, { entity: "scene.cook" }], schedules };
    const s: any = areaSection(hass, config, hass.areas.lounge);
    expect(s.cards[0]).toEqual({ type: "heading", heading: "Lounge", icon: "mdi:sofa" });
    expect(s.cards[1]).toEqual({
      type: "custom:moments-intents",
      intents: [{ entity: "scene.relax", area: "lounge" }],
      area: "lounge",
      include_house: false,
    });
    expect(s.cards.at(-1)).toEqual({
      type: "custom:moments-schedules",
      schedules: [schedules[0]],
      area: "lounge",
      summary: true,
      path: "schedules",
    });
    const off: any = areaSection(hass, { ...config, room_schedules: false }, hass.areas.lounge);
    expect(off.cards.at(-1).type).toBe("tile");
  });

  it("puts a full-width group heading before each group's areas", () => {
    const view = roomsView(base, home());
    const summary = view.sections.map((s: any) => s.column_span ? `# ${s.cards[0].heading}` : s.cards[0].heading);
    expect(summary).toEqual(["# Ground floor", "Kitchen", "Lounge", "# First floor", "Hall", "# Other", "Garden"]);
    expect(view.sections[0].column_span).toBe(view.max_columns);
  });
});
