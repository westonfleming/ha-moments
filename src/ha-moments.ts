import "./strategy/moments-dashboard-strategy";
import "./cards/moments-header";
import "./cards/moments-chips";
import "./cards/moments-intents";
import "./cards/moments-on-now";
import "./cards/moments-schedules";
import "./cards/moments-weather";
import "./cards/moments-temperatures";
import "./cards/moments-daylight";
import "./cards/moments-internet";
import "./cards/moments-appliance";

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
  { type: "moments-weather", name: "Moments weather", description: "Today in detail and the next 7 days: rain, wind and gusts." },
  { type: "moments-temperatures", name: "Moments temperatures", description: "Room and outdoor temperatures with today's range and a chart." },
  { type: "moments-daylight", name: "Moments daylight", description: "Today's outdoor light against your dark line." },
  { type: "moments-internet", name: "Moments internet", description: "Connection status, speeds and recent outages." },
  { type: "moments-appliance", name: "Moments appliance", description: "Program progress, finish time and recent runs." },
);

console.info(`%c MOMENTS %c ${__VERSION__} `, "background:#e8930c;color:#fff;font-weight:700", "");
