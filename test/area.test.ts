import { describe, expect, it } from "vitest";
import "../src/ha-moments";
import { areaImage, type MomentsArea } from "../src/cards/moments-area";
import { areasOnFloor, floorSummary, type MomentsFloorHeading } from "../src/cards/moments-floor-heading";
import { fakeHass } from "./fake-hass";

const ago = (min: number) => new Date(Date.now() - min * 60000).toISOString();

const house = () => {
  const hass = fakeHass(
    {
      "sensor.lt": ["21.0", { device_class: "temperature" }],
      "sensor.kt": ["22.0", { device_class: "temperature" }],
      "binary_sensor.lo": ["on", { device_class: "occupancy" }],
      "binary_sensor.ko": ["off", { device_class: "occupancy" }],
      "binary_sensor.leak": ["on", { device_class: "moisture", friendly_name: "Sink leak" }],
      "light.l1": "on",
      "light.l2": "on",
      "light.k1": "off",
    },
    {
      floors: { down: { floor_id: "down", name: "Downstairs" }, out: { floor_id: "out", name: "Outside" } },
      areas: {
        living: { area_id: "living", name: "Living room", floor_id: "down", picture: "/api/image/serve/abc/original" },
        kitchen: { area_id: "kitchen", name: "Kitchen", floor_id: "down" },
        garden: { area_id: "garden", name: "Garden", floor_id: "out" },
      },
      entities: Object.fromEntries(
        Object.entries({ "sensor.lt": "living", "binary_sensor.lo": "living", "light.l1": "living", "light.l2": "living", "sensor.kt": "kitchen", "binary_sensor.ko": "kitchen", "binary_sensor.leak": "kitchen", "light.k1": "kitchen" }).map(
          ([id, area_id]) => [id, { entity_id: id, area_id }],
        ),
      ),
    },
  );
  hass.states["binary_sensor.ko"].last_changed = ago(8);
  return hass;
};

describe("floors", () => {
  it("lists a floor's areas and sums them up", () => {
    const hass = house();
    expect(areasOnFloor(hass, "down")).toEqual(["living", "kitchen"]);
    expect(floorSummary(hass, ["living", "kitchen"])).toBe("1 occupied · 2 lights on · 21.5° avg");
    expect(floorSummary(hass, ["kitchen"])).toBe("Nobody · Lights off · 22.0°");
    expect(floorSummary(hass, ["garden"])).toBe("");
  });
  it("renders the heading", async () => {
    const el = document.createElement("moments-floor-heading") as MomentsFloorHeading;
    expect(() => el.setConfig({ type: "x" } as any)).toThrow(/floor/);
    el.setConfig({ type: "x", floor: "down" } as any);
    el.hass = house();
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector("h2")!.textContent).toBe("Downstairs");
    expect(el.shadowRoot!.querySelector("span")!.textContent).toContain("1 occupied");
    el.remove();
  });
});

describe("moments-area", () => {
  const make = async (config: Record<string, any>) => {
    const el = document.createElement("moments-area") as MomentsArea;
    el.setConfig({ type: "x", ...config } as any);
    el.hass = house();
    document.body.appendChild(el);
    await el.updateComplete;
    return el;
  };
  it("rejects bad config", () => {
    const el = document.createElement("moments-area") as MomentsArea;
    expect(() => el.setConfig({ type: "x" } as any)).toThrow(/area/);
    expect(() => el.setConfig({ type: "x", area: "a", image_style: "blur" } as any)).toThrow(/image_style/);
    expect(() => el.setConfig({ type: "x", area: "a", image_strength: 3 } as any)).toThrow(/image_strength/);
    expect(() => el.setConfig({ type: "x", area: "a", navigation_path: 4 } as any)).toThrow(/navigation_path/);
  });
  it("uses the area picture unless overridden or off", () => {
    const hass = house();
    expect(areaImage(hass, { type: "x", area: "living" })).toBe("/api/image/serve/abc/original");
    expect(areaImage(hass, { type: "x", area: "living", image: "/local/x.jpg" })).toBe("/local/x.jpg");
    expect(areaImage(hass, { type: "x", area: "living", image: false })).toBeUndefined();
    expect(areaImage(hass, { type: "x", area: "living", image_style: "none" })).toBeUndefined();
    expect(areaImage(hass, { type: "x", area: "kitchen" })).toBeUndefined();
  });
  it("washes the photo at 30% by default and shows the area", async () => {
    const el = await make({ area: "living" });
    const r = el.shadowRoot!;
    expect(r.querySelector("ha-card")!.className).toContain("wash");
    expect(r.querySelector<HTMLElement>(".img")!.style.opacity).toBe("0.3");
    expect(r.querySelector("h3")!.textContent).toBe("Living room");
    expect(r.querySelector(".temp")!.textContent).toBe("21.0°");
    expect(r.querySelector(".chip")!.textContent).toContain("2 of 2 on");
    el.remove();
  });
  it("greys an empty area and shows its alert", async () => {
    const el = await make({ area: "kitchen", image: "/local/k.jpg", image_style: "full" });
    const card = el.shadowRoot!.querySelector("ha-card")!;
    expect(card.className).toContain("full");
    expect(card.className).toContain("empty");
    expect(el.shadowRoot!.querySelector(".presence")!.textContent).toContain("Empty · 8 min");
    expect(el.shadowRoot!.querySelector(".chip.alert")!.textContent).toBe("Sink leak");
    el.remove();
  });
  it("opens the area's view on tap", async () => {
    history.replaceState(null, "", "/home/overview");
    const el = await make({ area: "living" });
    let fired = 0;
    window.addEventListener("location-changed", () => fired++, { once: true });
    el.shadowRoot!.querySelector<HTMLElement>("ha-card")!.click();
    expect(fired).toBe(1);
    expect(location.pathname).toBe("/home/living");
    el.remove();
  });
});

describe("area alerts", () => {
  it("raises high CO₂ even though the card shows only temperature", async () => {
    const hass = fakeHass(
      { "sensor.co2": ["1400", { device_class: "carbon_dioxide" }] },
      { areas: { bed: { area_id: "bed", name: "Bedroom" } }, entities: { "sensor.co2": { entity_id: "sensor.co2", area_id: "bed" } } },
    );
    const el = document.createElement("moments-area") as MomentsArea;
    el.setConfig({ type: "x", area: "bed" } as any);
    el.hass = hass;
    document.body.appendChild(el);
    await el.updateComplete;
    expect(el.shadowRoot!.querySelector(".chip.alert")!.textContent).toBe("CO₂ high");
    el.remove();
  });
});
