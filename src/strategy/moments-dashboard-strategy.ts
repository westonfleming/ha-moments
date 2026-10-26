import { areaOf, domainOf, isVisible } from "../helpers";
import { greeting, timeOfDay } from "../context/time-of-day";
import type { HomeAssistant, LovelaceCardConfig } from "../types";
import type { MomentsStrategyConfig } from "../config";

const ROOM_DOMAINS = ["light", "cover", "climate", "fan", "media_player", "switch", "lock"];

const heading = (text: string, icon?: string): LovelaceCardConfig => ({
  type: "heading",
  heading: text,
  ...(icon ? { icon } : {}),
});

const nowView = (config: MomentsStrategyConfig, hass: HomeAssistant) => {
  const tod = timeOfDay(hass, config.time_of_day_entity);
  const intents =
    config.intents ??
    Object.keys(hass.states)
      .filter((id) => domainOf(id) === "scene" && isVisible(hass, id))
      .slice(0, 8)
      .map((entity) => ({ entity }));
  const players =
    config.media_players ?? Object.keys(hass.states).filter((id) => domainOf(id) === "media_player");

  return {
    title: "Now",
    path: "now",
    icon: "mdi:home-clock",
    type: "sections",
    max_columns: 2,
    sections: [
      {
        type: "grid",
        column_span: 2,
        cards: [heading(greeting(tod)), { type: "custom:moments-chips" }],
      },
      {
        type: "grid",
        cards: [
          heading("Do something", "mdi:gesture-tap"),
          ...(intents.length
            ? [{ type: "custom:moments-intents", intents, time_of_day_entity: config.time_of_day_entity }]
            : []),
          ...players.map((entity) => ({
            type: "tile",
            entity,
            grid_options: { columns: "full" },
            visibility: [{ condition: "state", entity, state: "playing" }],
          })),
        ],
      },
      {
        type: "grid",
        cards: [heading("On now", "mdi:lightbulb-on-outline"), { type: "custom:moments-on-now" }],
      },
    ],
  };
};

const roomsView = (hass: HomeAssistant) => {
  const byArea = new Map<string, string[]>();
  for (const id of Object.keys(hass.states)) {
    if (!ROOM_DOMAINS.includes(domainOf(id)) || !isVisible(hass, id)) continue;
    const area = areaOf(hass, id);
    if (!area) continue;
    byArea.set(area, [...(byArea.get(area) ?? []), id]);
  }
  const areas = Object.values(hass.areas ?? {})
    .filter((a) => byArea.has(a.area_id))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    title: "Rooms",
    path: "rooms",
    icon: "mdi:floor-plan",
    type: "sections",
    sections: areas.map((area) => ({
      type: "grid",
      cards: [
        heading(area.name),
        ...byArea.get(area.area_id)!.map((entity) => ({ type: "tile", entity })),
      ],
    })),
  };
};

/**
 * Dashboard strategy: `strategy: { type: custom:moments }`.
 * Generates an intent-first "Now" view plus a "Rooms" fallback.
 */
export class MomentsDashboardStrategy extends HTMLElement {
  static async generate(config: MomentsStrategyConfig, hass: HomeAssistant) {
    return { title: "Moments", views: [nowView(config, hass), roomsView(hass)] };
  }
}

customElements.define("ll-strategy-dashboard-moments", MomentsDashboardStrategy);
