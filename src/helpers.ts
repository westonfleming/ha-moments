import type { HassEntity, HomeAssistant } from "./types";

export const domainOf = (entityId: string) => entityId.split(".")[0];

export const nameOf = (entity: HassEntity) =>
  entity.attributes.friendly_name ?? entity.entity_id;

/** Area of an entity, falling back to its device's area. */
export const areaOf = (hass: HomeAssistant, entityId: string): string | undefined => {
  const entry = hass.entities?.[entityId];
  if (!entry) return undefined;
  if (entry.area_id) return entry.area_id;
  return entry.device_id ? hass.devices?.[entry.device_id]?.area_id ?? undefined : undefined;
};

/** Entities worth showing: not hidden and not config/diagnostic. */
export const isVisible = (hass: HomeAssistant, entityId: string) => {
  const entry = hass.entities?.[entityId];
  return !entry || (!entry.hidden && !entry.entity_category);
};

export const minutesSince = (iso: string) =>
  Math.round((Date.now() - new Date(iso).getTime()) / 60000);

export const fireMoreInfo = (node: HTMLElement, entityId: string) =>
  node.dispatchEvent(
    new CustomEvent("hass-more-info", { detail: { entityId }, bubbles: true, composed: true }),
  );
