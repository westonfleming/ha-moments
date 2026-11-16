import { describe, expect, it } from "vitest";
import {
  activeMoment,
  callsFor,
  defaultActive,
  momentHolds,
  returnToDefault,
  validateAreaMoments,
  type AreaMomentsConfig,
} from "../src/moments";
import { fakeHass } from "./fake-hass";
import "../src/cards/moments-area-moments";

const now = Date.parse("2026-11-16T20:00:00Z");
const ago = (ms: number) => new Date(now - ms).toISOString();
const min = 60_000;

/** A light that turned on `onAgo` ms ago and was last updated `updAgo` ms ago. */
const light = (state: string, onAgo: number, updAgo = onAgo) => ({
  entity_id: "",
  state,
  attributes: {},
  last_changed: ago(onAgo),
  last_updated: ago(updAgo),
});

const config: AreaMomentsConfig = {
  area: "living_room",
  lights: ["light.lr"],
  default: { name: "Natural", run: "scene.natural" },
  moments: [
    { name: "Movie", run: "scene.movie" },
    { name: "Relax", run: "scene.relax" },
  ],
};

const setup = (states: Record<string, string>, lr = light("on", 30 * min)) => {
  const hass = fakeHass(states);
  hass.states["light.lr"] = { ...lr, entity_id: "light.lr" };
  return hass;
};

describe("activeMoment", () => {
  it("is the most recently started moment while its lights are on and unchanged", () => {
    const hass = setup({ "scene.movie": ago(10 * min), "scene.relax": ago(20 * min), "scene.natural": ago(40 * min) }, light("on", 40 * min, 10 * min));
    expect(activeMoment(hass, config, now)).toBe(0);
    expect(defaultActive(hass, config, now)).toBe(false);
  });
  it("ends when the lights go off", () => {
    const hass = setup({ "scene.movie": ago(10 * min) }, light("off", 5 * min));
    expect(activeMoment(hass, config, now)).toBe(-1);
    expect(defaultActive(hass, config, now)).toBe(false);
  });
  it("ends when the lights are adjusted after the moment, and the default takes over", () => {
    const hass = setup({ "scene.movie": ago(10 * min) }, light("on", 40 * min, 2 * min));
    expect(activeMoment(hass, config, now)).toBe(-1);
    expect(defaultActive(hass, config, now)).toBe(true);
  });
  it("ignores adjustments for a dynamic scene, but not switching back on by hand", () => {
    const c = { ...config, moments: [{ name: "Bath", run: "scene.bath", dynamic: true }] };
    expect(activeMoment(setup({ "scene.bath": ago(10 * min) }, light("on", 40 * min, 1 * min)), c, now)).toBe(0);
    expect(activeMoment(setup({ "scene.bath": ago(10 * min) }, light("on", 5 * min)), c, now)).toBe(-1);
  });
  it("treats a Hue is_dynamic scene as dynamic", () => {
    const hass = setup({ "scene.movie": ago(10 * min) }, light("on", 40 * min, 1 * min));
    hass.states["scene.movie"].attributes.is_dynamic = true;
    expect(activeMoment(hass, config, now)).toBe(0);
  });
  it("ends when the default ran after it", () => {
    const hass = setup({ "scene.movie": ago(20 * min), "scene.natural": ago(10 * min) }, light("on", 40 * min, 10 * min));
    expect(activeMoment(hass, config, now)).toBe(-1);
    expect(defaultActive(hass, config, now)).toBe(true);
  });
  it("follows active_entity, gated by the lights", () => {
    const c: AreaMomentsConfig = { lights: ["light.lr"], moments: [{ name: "Read", run: "scene.read", active_entity: "select.lr_scene" }] };
    const hass = setup({ "select.lr_scene": "Read" });
    expect(activeMoment(hass, c, now)).toBe(0);
    hass.states["select.lr_scene"].state = "Relax";
    expect(activeMoment(hass, c, now)).toBe(-1);
    hass.states["select.lr_scene"].state = "Read";
    hass.states["light.lr"].state = "off";
    expect(activeMoment(hass, c, now)).toBe(-1);
  });
  it("is active while a script moment runs, and uses last_triggered after", () => {
    const c: AreaMomentsConfig = { lights: ["light.lr"], moments: [{ name: "Bedtime", run: "script.bedtime" }] };
    const hass = fakeHass({ "script.bedtime": ["off", { last_triggered: ago(5 * min) }] });
    hass.states["light.lr"] = { ...light("on", 40 * min, 5 * min), entity_id: "light.lr" };
    expect(momentHolds(hass, c.moments![0], c, now)).toBe(true);
    hass.states["light.lr"].last_updated = ago(1 * min);
    expect(momentHolds(hass, c.moments![0], c, now)).toBe(false);
    hass.states["script.bedtime"].state = "on";
    expect(momentHolds(hass, c.moments![0], c, now)).toBe(true);
  });
});

describe("returnToDefault", () => {
  it("runs the default, or turns the lights off without one", () => {
    const hass = setup({});
    expect(returnToDefault(hass, config)).toEqual([{ domain: "scene", service: "turn_on", data: { entity_id: "scene.natural" } }]);
    expect(returnToDefault(hass, { ...config, default: undefined })).toEqual([
      { domain: "light", service: "turn_off", data: { entity_id: ["light.lr"] } },
    ]);
  });
  it("maps run targets to services", () => {
    expect(callsFor(["scene.a", "script.b", "automation.c", "button.d"]).map((c) => `${c.domain}.${c.service}`)).toEqual([
      "scene.turn_on",
      "script.turn_on",
      "automation.trigger",
      "button.press",
    ]);
  });
});

describe("validateAreaMoments", () => {
  it("explains bad configs", () => {
    expect(() => validateAreaMoments({})).toThrow(/add a default or at least one moment/);
    expect(() => validateAreaMoments({ moments: [{ run: "scene.a" } as any] })).toThrow(/moment 1 needs a name/);
    expect(() => validateAreaMoments({ moments: [{ name: "Movie" } as any] })).toThrow(/"Movie" needs run/);
    expect(() => validateAreaMoments({ default: 3 as any })).toThrow(/default must be/);
    expect(validateAreaMoments({ default: "scene.a" })).toBeTruthy();
  });
});

describe("moments-area-moments card", () => {
  const mount = async (c: AreaMomentsConfig, hass: any) => {
    const card = document.createElement("moments-area-moments") as any;
    card.setConfig({ type: "custom:moments-area-moments", ...c });
    card.hass = hass;
    document.body.append(card);
    await card.updateComplete;
    return card;
  };
  const chips = (card: any) => [...card.shadowRoot.querySelectorAll("button.chip")] as HTMLButtonElement[];

  it("shows the default first, marks the active moment, and returns to default on tap", async () => {
    const t = Date.now();
    const iso = (ms: number) => new Date(t - ms).toISOString();
    const hass = fakeHass({ "scene.movie": iso(10 * min), "scene.natural": iso(40 * min) });
    hass.states["light.lr"] = { entity_id: "light.lr", state: "on", attributes: {}, last_changed: iso(40 * min), last_updated: iso(10 * min) };
    const card = await mount(config, hass);
    expect(chips(card).map((b) => b.textContent!.trim())).toEqual(["Natural", "Movie", "Relax"]);
    expect(chips(card).map((b) => b.getAttribute("aria-pressed"))).toEqual(["false", "true", "false"]);
    chips(card)[1].click();
    await new Promise((r) => setTimeout(r));
    expect(hass.calls).toEqual([["scene", "turn_on", { entity_id: "scene.natural" }]]);
    chips(card)[2].click();
    await new Promise((r) => setTimeout(r));
    expect(hass.calls[1]).toEqual(["scene", "turn_on", { entity_id: "scene.relax" }]);
    card.remove();
  });

  it("hides the default chip with show_default: false", async () => {
    const card = await mount({ ...config, show_default: false }, setup({}));
    expect(chips(card)).toHaveLength(2);
    card.remove();
  });
});
