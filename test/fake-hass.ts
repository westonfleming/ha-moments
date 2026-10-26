import type { HassEntity, HomeAssistant } from "../src/types";

/** A minimal fake `hass` for tests. Pass states as { entity_id: state | [state, attributes] }. */
export const fakeHass = (
  states: Record<string, string | [string, Record<string, any>]>,
  extra: Partial<HomeAssistant> = {},
): HomeAssistant & { calls: [string, string, any][] } => {
  const calls: [string, string, any][] = [];
  const s: Record<string, HassEntity> = {};
  for (const [id, v] of Object.entries(states)) {
    const [state, attributes] = Array.isArray(v) ? v : [v, {}];
    s[id] = { entity_id: id, state, attributes, last_changed: new Date().toISOString() };
  }
  return {
    states: s,
    entities: {},
    devices: {},
    areas: {},
    callService: async (domain, service, data) => {
      calls.push([domain, service, data]);
    },
    calls,
    ...extra,
  };
};
