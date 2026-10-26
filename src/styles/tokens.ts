import { css } from "lit";

// Shared look: rounded tiles, warm amber for "on", quiet alerts.
// Falls back to HA theme variables so a user theme still applies.
export const tokens = css`
  :host {
    --moments-radius: var(--ha-card-border-radius, 16px);
    --moments-gap: 8px;
    --moments-on: var(--state-light-active-color, #e8930c);
    --moments-on-soft: color-mix(in srgb, var(--moments-on) 16%, transparent);
    /* Text on the "on" accent: a dark shade of the accent, readable in light and dark themes. */
    --moments-on-fg: color-mix(in srgb, var(--moments-on) 22%, black);
    --moments-alert: var(--error-color, #d9442e);
    --moments-alert-soft: color-mix(in srgb, var(--moments-alert) 14%, transparent);
    --moments-warn: var(--warning-color, #e8930c);
    --moments-warn-soft: color-mix(in srgb, var(--moments-warn) 14%, transparent);
    --moments-tile: var(--ha-card-background, var(--card-background-color, #fff));
    --moments-fg: var(--primary-text-color);
    --moments-muted: var(--secondary-text-color);
  }
  button {
    font: inherit;
    color: inherit;
    border: 0;
    cursor: pointer;
    -webkit-tap-highlight-color: transparent;
  }
  button:focus-visible {
    outline: 2px solid var(--primary-color);
    outline-offset: 2px;
  }
`;
