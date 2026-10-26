import type { MomentsStrategyConfig } from "../config";
import { SCHEDULES_PATH } from "./rooms-view";

/** Subview with every schedule; only generated when schedules are configured. */
export const schedulesView = (config: MomentsStrategyConfig) =>
  config.schedules?.length
    ? {
        title: "Schedules",
        path: SCHEDULES_PATH,
        icon: "mdi:calendar-clock",
        subview: true,
        type: "sections",
        max_columns: 2,
        sections: [
          {
            type: "grid",
            column_span: 2,
            cards: [{ type: "custom:moments-schedules", schedules: config.schedules, all: true }],
          },
        ],
      }
    : undefined;
