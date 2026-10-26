import { domainOf, isVisible } from "../helpers";
import type { HomeAssistant, LovelaceCardConfig } from "../types";
import type { Intent, MomentsStrategyConfig } from "../config";
import {
  SCHEDULES_PATH,
  areaEntities,
  areaIntents,
  clean,
  contextOptions,
  heading,
  tile,
} from "./rooms-view";

const THIS_ROOM_DOMAINS = ["light", "cover", "climate", "media_player"];

/** Configured intents, or the first 8 visible scenes as house-level intents. */
export const defaultIntents = (config: MomentsStrategyConfig, hass: HomeAssistant): Intent[] =>
  config.intents ??
  Object.keys(hass.states)
    .filter((id) => domainOf(id) === "scene" && isVisible(hass, id))
    .slice(0, 8)
    .map((entity) => ({ entity }));

export const mediaPlayers = (config: MomentsStrategyConfig, hass: HomeAssistant) =>
  (config.media_players ?? Object.keys(hass.states).filter((id) => domainOf(id) === "media_player")).filter(
    (id) => id in hass.states && isVisible(hass, id),
  );

const firstWeather = (hass: HomeAssistant) =>
  Object.keys(hass.states).find((id) => domainOf(id) === "weather" && isVisible(hass, id));

export const headerSection = (config: MomentsStrategyConfig, hass: HomeAssistant): LovelaceCardConfig => {
  const schedules = config.schedules?.length ? config.schedules : undefined;
  return {
    type: "grid",
    column_span: 2,
    cards: [
      clean({
        type: "custom:moments-header",
        ...contextOptions(config),
        weather_entity: config.weather_entity ?? firstWeather(hass),
        temperature_entity: config.temperature_entity,
        rooms_by_user: config.rooms_by_user,
        schedules_path: schedules ? SCHEDULES_PATH : undefined,
      }),
      clean({ type: "custom:moments-chips", ...config.chips, schedules }),
    ],
  };
};

/** One "This room" section per mapped area, visible only to the users mapped to it. */
export const thisRoomSections = (
  config: MomentsStrategyConfig,
  hass: HomeAssistant,
  intents: Intent[],
): LovelaceCardConfig[] => {
  const usersByArea = new Map<string, string[]>();
  for (const [user, area] of Object.entries(config.rooms_by_user ?? {})) {
    if (!area) continue;
    usersByArea.set(area, [...(usersByArea.get(area) ?? []), user]);
  }
  const sections: LovelaceCardConfig[] = [];
  for (const [area, users] of usersByArea) {
    const roomIntents = areaIntents(intents, area);
    const domains = THIS_ROOM_DOMAINS.filter((d) => config.areas?.[area]?.domains?.includes(d) ?? true);
    const entities = areaEntities(hass, config, area, domains);
    if (!roomIntents.length && !entities.length) continue;
    sections.push({
      type: "grid",
      visibility: [{ condition: "user", users }],
      cards: [
        heading(hass.areas?.[area]?.name ?? area, hass.areas?.[area]?.icon),
        ...(roomIntents.length
          ? [{ type: "custom:moments-intents", intents: roomIntents, area, include_house: false, ...contextOptions(config) }]
          : []),
        ...entities.map((id) => tile(hass, id)),
      ],
    });
  }
  return sections;
};

const playing = (entity: string) => ({ condition: "state", entity, state: "playing" });

export const mediaSection = (config: MomentsStrategyConfig, hass: HomeAssistant): LovelaceCardConfig | undefined => {
  const players = mediaPlayers(config, hass);
  if (!players.length) return undefined;
  return {
    type: "grid",
    visibility: [{ condition: "or", conditions: players.map(playing) }],
    cards: [
      heading("Playing", "mdi:play-circle-outline"),
      ...players.map((entity) => ({
        type: "tile",
        entity,
        grid_options: { columns: "full" },
        visibility: [playing(entity)],
      })),
    ],
  };
};

/**
 * Now view. Section order is the iPhone stacking order: header + chips, This room
 * (per mapped user), Do something, On now, Playing. On iPad the header spans both
 * columns and This room lands top-left.
 */
export const nowView = (config: MomentsStrategyConfig, hass: HomeAssistant) => {
  const intents = defaultIntents(config, hass);
  const media = mediaSection(config, hass);
  const sections: LovelaceCardConfig[] = [
    headerSection(config, hass),
    ...thisRoomSections(config, hass, intents),
    {
      type: "grid",
      cards: [
        heading("Do something", "mdi:gesture-tap"),
        ...(intents.length
          ? [clean({ type: "custom:moments-intents", intents, rooms_by_user: config.rooms_by_user, ...contextOptions(config) })]
          : []),
      ],
    },
    {
      type: "grid",
      cards: [
        heading("On now", "mdi:lightbulb-on-outline"),
        clean({ type: "custom:moments-on-now", ...config.on_now, groups: config.room_groups }),
      ],
    },
    ...(media ? [media] : []),
  ];
  return { title: "Now", path: "now", icon: "mdi:home-clock", type: "sections", max_columns: 2, sections };
};
