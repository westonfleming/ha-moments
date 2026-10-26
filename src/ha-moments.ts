import "./strategy/moments-dashboard-strategy";
import "./cards/moments-header";
import "./cards/moments-chips";
import "./cards/moments-intents";
import "./cards/moments-on-now";
import "./cards/moments-schedules";

declare const __VERSION__: string;

declare global {
  interface Window {
    customCards?: { type: string; name: string; description: string }[];
  }
}

window.customCards = window.customCards ?? [];
window.customCards.push(
  { type: "moments-header", name: "Moments header", description: "Greeting, time and a one-line read of the house." },
  { type: "moments-chips", name: "Moments chips", description: "Alerts that only appear when something needs you." },
  { type: "moments-intents", name: "Moments intents", description: "Scenes and scripts, ordered by time of day." },
  { type: "moments-on-now", name: "Moments on now", description: "Everything that is on or open right now." },
  { type: "moments-schedules", name: "Moments schedules", description: "Quiet list of schedules; edit their time and days in place." },
);

console.info(`%c MOMENTS %c ${__VERSION__} `, "background:#e8930c;color:#fff;font-weight:700", "");
