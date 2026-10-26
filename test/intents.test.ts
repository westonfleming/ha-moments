import { describe, expect, it, vi } from "vitest";
import {
  intentGroups,
  intentsFor,
  isActive,
  orderByContext,
  serviceFor,
  validateIntents,
  SCENE_ACTIVE_MS,
} from "../src/intents";
import type { Intent } from "../src/config";
import { fakeHass } from "./fake-hass";
import "../src/cards/moments-intents";

const house1: Intent = { entity: "scene.relax" };
const house2: Intent = { entity: "script.bedtime", when: ["night"] };
const lounge: Intent = { entity: "scene.lounge_movie", area: "lounge", when: ["evening"] };
const shared: Intent = { entity: "script.lights_off", areas: ["lounge", "kitchen"] };
const kitchen: Intent = { entity: "scene.kitchen_cook", area: "kitchen" };
const all = [house1, lounge, house2, shared, kitchen];
const ids = (list: Intent[]) => list.map((i) => i.entity);

describe("intentsFor", () => {
  it("shows only house intents without area or mapped user", () => {
    expect(ids(intentsFor(all, {}))).toEqual(["scene.relax", "script.bedtime"]);
  });
  it("treats an empty areas list as house-level", () => {
    expect(ids(intentsFor([{ entity: "scene.a", areas: [] }], {}))).toEqual(["scene.a"]);
  });
  it("leads with the user's room, then house intents", () => {
    expect(ids(intentsFor(all, { userArea: "lounge" }))).toEqual([
      "scene.lounge_movie",
      "script.lights_off",
      "scene.relax",
      "script.bedtime",
    ]);
  });
  it("shows only the card's area intents", () => {
    expect(ids(intentsFor(all, { area: "kitchen" }))).toEqual(["script.lights_off", "scene.kitchen_cook"]);
  });
  it("adds house intents to an area with include_house", () => {
    expect(ids(intentsFor(all, { area: "kitchen", includeHouse: true }))).toEqual([
      "script.lights_off",
      "scene.kitchen_cook",
      "scene.relax",
      "script.bedtime",
    ]);
  });
  it("prefers the card's area over the user's room", () => {
    expect(ids(intentsFor(all, { area: "kitchen", userArea: "lounge" }))).toEqual([
      "script.lights_off",
      "scene.kitchen_cook",
    ]);
  });
  it("drops empty groups and keeps the room context per group", () => {
    const groups = intentGroups(all, { userArea: "garage" });
    expect(groups).toHaveLength(1);
    expect(groups[0].area).toBeUndefined();
    expect(intentGroups(all, { userArea: "lounge" }).map((g) => g.area)).toEqual(["lounge", undefined]);
  });
});

describe("orderByContext", () => {
  const list: Intent[] = [
    { entity: "scene.a" },
    { entity: "scene.b", when: ["night"] },
    { entity: "scene.c", when: ["evening", "dark"] },
    { entity: "scene.d", when: ["dark"] },
    { entity: "scene.e" },
  ];
  it("moves matching intents first and keeps config order otherwise", () => {
    expect(ids(orderByContext(list, ["evening"]))).toEqual(["scene.c", "scene.a", "scene.b", "scene.d", "scene.e"]);
    expect(ids(orderByContext(list, ["evening", "dark"]))).toEqual([
      "scene.c",
      "scene.d",
      "scene.a",
      "scene.b",
      "scene.e",
    ]);
  });
  it("is a no-op when nothing matches", () => {
    expect(ids(orderByContext(list, ["morning", "bright"]))).toEqual(ids(list));
  });
  it("does not mutate its input", () => {
    const copy = [...list];
    orderByContext(list, ["night"]);
    expect(list).toEqual(copy);
  });
});

describe("serviceFor", () => {
  it("maps domains to services", () => {
    expect(serviceFor({ entity: "scene.relax" })).toEqual({
      domain: "scene",
      service: "turn_on",
      data: { entity_id: "scene.relax" },
    });
    expect(serviceFor({ entity: "automation.x" }).service).toBe("trigger");
    expect(serviceFor({ entity: "button.x" }).service).toBe("press");
    expect(serviceFor({ entity: "script.x" }).service).toBe("turn_on");
  });
  it("passes area_id to scripts in a room context only", () => {
    expect(serviceFor({ entity: "script.off" }, "lounge").data).toEqual({
      entity_id: "script.off",
      variables: { area_id: "lounge" },
    });
    expect(serviceFor({ entity: "script.off" }).data).toEqual({ entity_id: "script.off" });
    expect(serviceFor({ entity: "scene.relax" }, "lounge").data).toEqual({ entity_id: "scene.relax" });
  });
});

describe("isActive", () => {
  const now = Date.parse("2026-10-26T20:00:00Z");
  const ago = (ms: number) => new Date(now - ms).toISOString();
  const hour = 3600_000;

  it("is active while a script runs", () => {
    const hass = fakeHass({ "script.a": "on", "script.b": "off" });
    expect(isActive(hass, { entity: "script.a" })).toBe(true);
    expect(isActive(hass, { entity: "script.b" })).toBe(false);
  });
  it("follows active_entity when set", () => {
    const hass = fakeHass({ "scene.a": ago(1000), "input_boolean.movie": "on", "input_boolean.off": "off" });
    expect(isActive(hass, { entity: "automation.x", active_entity: "input_boolean.movie" })).toBe(true);
    expect(isActive(hass, { entity: "scene.a", active_entity: "input_boolean.off" }, undefined, now)).toBe(false);
  });
  it("marks the most recent shown scene active within 4 hours", () => {
    const hass = fakeHass({ "scene.a": ago(2 * hour), "scene.b": ago(hour), "scene.c": "unknown" });
    const shown: Intent[] = [{ entity: "scene.a" }, { entity: "scene.b" }, { entity: "scene.c" }];
    expect(shown.map((i) => isActive(hass, i, shown, now))).toEqual([false, true, false]);
  });
  it("ignores scenes that are not shown", () => {
    const hass = fakeHass({ "scene.a": ago(2 * hour), "scene.hidden": ago(hour) });
    expect(isActive(hass, { entity: "scene.a" }, [{ entity: "scene.a" }], now)).toBe(true);
  });
  it("expires after 4 hours", () => {
    const hass = fakeHass({ "scene.a": ago(SCENE_ACTIVE_MS + 1000), "scene.b": ago(SCENE_ACTIVE_MS - 1000) });
    expect(isActive(hass, { entity: "scene.a" }, undefined, now)).toBe(false);
    expect(isActive(hass, { entity: "scene.b" }, undefined, now)).toBe(true);
  });
  it("is false for missing entities, other domains and no hass", () => {
    const hass = fakeHass({ "automation.x": "on" });
    expect(isActive(hass, { entity: "scene.missing" }, undefined, now)).toBe(false);
    expect(isActive(hass, { entity: "automation.x" }, undefined, now)).toBe(false);
    expect(isActive(undefined, { entity: "script.a" })).toBe(false);
  });
});

describe("validateIntents", () => {
  it("requires a non-empty list", () => {
    expect(() => validateIntents(undefined)).toThrow(/needs a list of intents/);
    expect(() => validateIntents([])).toThrow(/needs a list of intents/);
  });
  it("requires an entity", () => {
    expect(() => validateIntents([{ name: "x" }])).toThrow(/intent 1 needs an entity/);
  });
  it("rejects unknown when values with the allowed list", () => {
    expect(() => validateIntents([{ entity: "scene.a", when: ["evening", "dusk"] }])).toThrow(
      /unknown "when" value "dusk" on scene.a. Use any of: morning, day, evening, night, dark, bright/,
    );
    expect(() => validateIntents([{ entity: "scene.a", when: "evening" }])).toThrow(/must be a list/);
  });
  it("accepts valid intents", () => {
    expect(validateIntents(all)).toBe(all);
  });
});

describe("moments-intents card", () => {
  const make = () => document.createElement("moments-intents") as any;

  it("errors on missing intents and bad when values", () => {
    expect(() => make().setConfig({ type: "custom:moments-intents" })).toThrow(/needs a list of intents/);
    expect(() => make().setConfig({ type: "x", intents: [{ entity: "scene.a", when: ["noon"] }] })).toThrow(/noon/);
  });

  it("stubs with up to four scenes", () => {
    const hass = fakeHass(
      Object.fromEntries(["a", "b", "c", "d", "e"].map((n) => [`scene.${n}`, "unknown"])),
    );
    hass.states["light.x"] = { entity_id: "light.x", state: "on", attributes: {}, last_changed: "" };
    const stub = customElements.get("moments-intents")!.prototype.constructor.getStubConfig(hass);
    expect(ids(stub.intents)).toEqual(["scene.a", "scene.b", "scene.c", "scene.d"]);
    expect(() => make().setConfig(stub)).not.toThrow();
  });

  it("runs a tapped intent with the room's area_id", async () => {
    const card = make();
    card.setConfig({ type: "x", intents: [{ entity: "script.off", areas: ["lounge"] }], rooms_by_user: { u1: "lounge" } });
    const hass = fakeHass({ "script.off": "off" }, { user: { id: "u1", name: "Ann" } });
    card.hass = hass;
    document.body.append(card);
    await card.updateComplete;
    (card.shadowRoot.querySelector("button.intent") as HTMLButtonElement).click();
    await Promise.resolve();
    expect(hass.calls).toEqual([["script", "turn_on", { entity_id: "script.off", variables: { area_id: "lounge" } }]]);
    card.remove();
  });

  it("long-press opens more-info and does not run", async () => {
    vi.useFakeTimers();
    const card = make();
    card.setConfig({ type: "x", intents: [{ entity: "scene.relax" }] });
    const hass = fakeHass({ "scene.relax": "unknown" });
    card.hass = hass;
    document.body.append(card);
    await card.updateComplete;
    const opened: string[] = [];
    card.addEventListener("hass-more-info", (e: any) => opened.push(e.detail.entityId));
    const btn = card.shadowRoot.querySelector("button.intent") as HTMLButtonElement;
    btn.dispatchEvent(new PointerEvent("pointerdown", { button: 0, clientX: 5, clientY: 5 }));
    vi.advanceTimersByTime(600);
    btn.dispatchEvent(new PointerEvent("pointerup", { button: 0 }));
    btn.click();
    expect(opened).toEqual(["scene.relax"]);
    expect(hass.calls).toEqual([]);

    btn.dispatchEvent(new PointerEvent("pointerdown", { button: 0, clientX: 5, clientY: 5 }));
    btn.dispatchEvent(new PointerEvent("pointermove", { clientX: 5, clientY: 30 }));
    vi.advanceTimersByTime(600);
    expect(opened).toHaveLength(1);
    vi.useRealTimers();
    card.remove();
  });
});
