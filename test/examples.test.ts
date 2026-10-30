import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parse, parseAllDocuments } from "yaml";
import "../src/ha-moments";
import { generateDashboard } from "../src/strategy/moments-dashboard-strategy";
import { fakeHass } from "./fake-hass";

const load = (f: string) => readFileSync(`examples/${f}`, "utf8");

const setConfig = (config: any) => {
  const el = document.createElement(config.type.replace("custom:", "")) as any;
  el.setConfig(config);
};

const customCards = (node: any): any[] =>
  Array.isArray(node)
    ? node.flatMap(customCards)
    : node && typeof node === "object"
      ? [...(typeof node.type === "string" && node.type.startsWith("custom:") ? [node] : []), ...Object.values(node).flatMap(customCards)]
      : [];

describe("examples", () => {
  it("every card in cards.yaml is a valid config", () => {
    for (const doc of parseAllDocuments(load("cards.yaml"))) setConfig(doc.toJS());
  });

  it("every custom card in tabs.yaml is a valid config", () => {
    const cards = customCards(parse(load("tabs.yaml")));
    expect(cards.length).toBeGreaterThan(6);
    for (const card of cards) expect(() => setConfig(card), card.type).not.toThrow();
  });

  it("dashboard.yaml generates cards with valid configs", async () => {
    const { strategy } = parse(load("dashboard.yaml"));
    const hass = fakeHass(
      { "light.a": "on", "scene.living_room_relax": "2026-01-01T00:00:00Z", "weather.home": ["sunny", { temperature: 14 }] },
      {
        areas: { living_room: { area_id: "living_room", name: "Living room" }, bedroom_1: { area_id: "bedroom_1", name: "Bedroom 1" } },
        entities: { "light.a": { entity_id: "light.a", area_id: "bedroom_1" } },
      },
    );
    const cards = customCards(await generateDashboard(strategy, hass));
    expect(cards.length).toBeGreaterThan(4);
    for (const card of cards) expect(() => setConfig(card), card.type).not.toThrow();
  });
});
