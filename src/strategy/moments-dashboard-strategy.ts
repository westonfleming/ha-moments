import type { HomeAssistant } from "../types";
import type { MomentsStrategyConfig } from "../config";
import { nowView } from "./now-view";
import { roomsView } from "./rooms-view";
import { schedulesView } from "./schedules-view";

export const generateDashboard = (config: MomentsStrategyConfig, hass: HomeAssistant) => {
  const schedules = schedulesView(config);
  return {
    title: "Moments",
    views: [nowView(config, hass), roomsView(config, hass), ...(schedules ? [schedules] : [])],
  };
};

/**
 * Dashboard strategy: `strategy: { type: custom:moments }`.
 * Generates an intent-first "Now" view, a "Rooms" view and, with schedules, a Schedules subview.
 */
export class MomentsDashboardStrategy extends HTMLElement {
  static async generate(config: MomentsStrategyConfig, hass: HomeAssistant) {
    return generateDashboard(config, hass);
  }
}

if (!customElements.get("ll-strategy-dashboard-moments")) {
  customElements.define("ll-strategy-dashboard-moments", MomentsDashboardStrategy);
}
