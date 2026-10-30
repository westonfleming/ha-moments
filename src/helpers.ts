import type { HassEntity, HomeAssistant } from "./types";

/** A plausible entity id, e.g. sensor.example. */
export const isEntityId = (v: unknown): v is string => typeof v === "string" && /^[a-z0-9_]+\.[a-z0-9_]+$/.test(v);

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

export type HapticType = "success" | "warning" | "failure" | "light" | "medium" | "heavy" | "selection";

/** Haptic feedback in the companion app (ignored in browsers). */
export const haptic = (node: HTMLElement, type: HapticType = "light") =>
  node.dispatchEvent(new CustomEvent("haptic", { detail: type, bubbles: true, composed: true }));

/** Shows HA's toast at the bottom of the screen. */
export const toast = (node: HTMLElement, message: string) =>
  node.dispatchEvent(new CustomEvent("hass-notification", { detail: { message }, bubbles: true, composed: true }));

/** Calls a service with haptics, and a toast if it fails. */
export const callWithFeedback = async (
  node: HTMLElement,
  hass: HomeAssistant | undefined,
  domain: string,
  service: string,
  data?: Record<string, any>,
) => {
  if (!hass) return;
  haptic(node, "light");
  try {
    await hass.callService(domain, service, data);
  } catch (err: any) {
    haptic(node, "failure");
    toast(node, `Couldn't ${service.replace(/_/g, " ")}: ${err?.message ?? err}`);
  }
};

/** Resolves a view path: absolute paths as-is, others as a view of the current dashboard. */
export const resolvePath = (path: string, pathname = location.pathname) =>
  path.startsWith("/") ? path : `/${pathname.split("/")[1]}/${path}`;

/** Navigates within the HA frontend. */
export const navigate = (path: string) => {
  history.pushState(null, "", resolvePath(path));
  window.dispatchEvent(new CustomEvent("location-changed"));
};
