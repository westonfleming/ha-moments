import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parse, parseAllDocuments } from "yaml";
import "../src/ha-moments";

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

  it("every custom card in home.yaml is a valid config", () => {
    const cards = customCards(parse(load("home.yaml")));
    expect(cards.map((c) => c.type)).toEqual(expect.arrayContaining(["custom:moments-area", "custom:moments-floor-heading", "custom:moments-area-header", "custom:moments-metric", "custom:moments-tile"]));
    for (const card of cards) expect(() => setConfig(card), card.type).not.toThrow();
  });
});
