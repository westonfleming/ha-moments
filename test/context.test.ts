import { describe, expect, it } from "vitest";
import { timeOfDay } from "../src/context/time-of-day";
import { currentContext, daylight } from "../src/context/daylight";
import { fakeHass } from "./fake-hass";

const at = (h: number) => new Date(2026, 0, 1, h, 0);

describe("timeOfDay", () => {
  it("follows the clock at the boundaries", () => {
    expect(timeOfDay(undefined, undefined, at(4))).toBe("night");
    expect(timeOfDay(undefined, undefined, at(5))).toBe("morning");
    expect(timeOfDay(undefined, undefined, at(11))).toBe("day");
    expect(timeOfDay(undefined, undefined, at(17))).toBe("evening");
    expect(timeOfDay(undefined, undefined, at(22))).toBe("night");
  });
  it("prefers a valid helper and ignores an invalid one", () => {
    expect(timeOfDay(fakeHass({ "input_select.tod": "evening" }), "input_select.tod", at(8))).toBe("evening");
    expect(timeOfDay(fakeHass({ "input_select.tod": "lunch" }), "input_select.tod", at(8))).toBe("morning");
  });
});

describe("daylight", () => {
  const hass = fakeHass({ "sensor.lux": "20", "sensor.bad": "unavailable" });
  it("is undefined without a usable sensor", () => {
    expect(daylight(hass, undefined)).toBeUndefined();
    expect(daylight(hass, "sensor.bad")).toBeUndefined();
  });
  it("uses the threshold", () => {
    expect(daylight(hass, "sensor.lux")).toBe("dark");
    expect(daylight(hass, "sensor.lux", 10)).toBe("bright");
  });
  it("combines into the current context", () => {
    expect(currentContext(hass, { illuminance_entity: "sensor.lux" }, at(19))).toEqual(["evening", "dark"]);
  });
});
