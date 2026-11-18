import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parse } from "yaml";

const file = "blueprints/script/moments/area_moment.yaml";
const input = { tag: "!input", resolve: (v: string) => ({ input: v }) };
const doc = parse(readFileSync(file, "utf8"), { customTags: [input] });

const declared = (sections: Record<string, any>): string[] =>
  Object.entries(sections).flatMap(([k, v]) => (v?.input ? declared(v.input) : [k]));

const used = (node: any): string[] =>
  Array.isArray(node)
    ? node.flatMap(used)
    : node && typeof node === "object"
      ? "input" in node && typeof node.input === "string" && Object.keys(node).length === 1
        ? [node.input]
        : Object.values(node).flatMap(used)
      : [];

describe("area moment blueprint", () => {
  it("is a script blueprint", () => {
    expect(doc.blueprint.domain).toBe("script");
    expect(doc.sequence.length).toBeGreaterThan(0);
  });
  it("uses only declared inputs, and declares none it doesn't use", () => {
    const names = declared(doc.blueprint.input);
    const refs = used({ variables: doc.variables, sequence: doc.sequence });
    expect(refs.filter((r) => !names.includes(r))).toEqual([]);
    expect(names.filter((n) => !refs.includes(n))).toEqual([]);
  });
  it("gives every input except the name a default", () => {
    const missing: string[] = [];
    const walk = (s: Record<string, any>) =>
      Object.entries(s).forEach(([k, v]) => (v.input ? walk(v.input) : v.default === undefined && missing.push(k)));
    walk(doc.blueprint.input);
    expect(missing).toEqual(["moment_name"]);
  });
});
