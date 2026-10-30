import { css } from "lit";

// Shared look: rounded tiles, warm amber for "on", quiet alerts.
// Falls back to HA theme variables so a user theme still applies; the Moments
// theme (themes/moments.yaml) sets these for the full look.
export const tokens = css`
  :host {
    --moments-radius: var(--ha-card-border-radius, 20px);
    --moments-inner-radius: calc(var(--moments-radius) * 0.7);
    --moments-gap: 10px;
    --moments-on: var(--state-light-active-color, #e8930c);
    --moments-on-soft: color-mix(in srgb, var(--moments-on) 16%, transparent);
    /* Text on the "on" accent: a dark shade of the accent, readable in light and dark themes. */
    --moments-on-fg: color-mix(in srgb, var(--moments-on) 22%, black);
    --moments-alert: var(--error-color, #d9442e);
    --moments-alert-soft: color-mix(in srgb, var(--moments-alert) 14%, transparent);
    --moments-warn: var(--warning-color, #e8930c);
    --moments-warn-soft: color-mix(in srgb, var(--moments-warn) 14%, transparent);
    --moments-ok: var(--success-color, #2e9d5b);
    --moments-ok-soft: color-mix(in srgb, var(--moments-ok) 14%, transparent);
    --moments-tile: var(--ha-card-background, var(--card-background-color, #fff));
    --moments-fg: var(--primary-text-color);
    --moments-muted: var(--secondary-text-color);
    /* A tile inside a tile. */
    --moments-raised: color-mix(in srgb, var(--moments-fg) 6%, var(--moments-tile));
    --moments-line: var(--divider-color, color-mix(in srgb, var(--moments-fg) 10%, transparent));
    /* Chart and icon colours. */
    --moments-blue: var(--moments-theme-blue, #3d8fe0);
    --moments-teal: var(--moments-theme-teal, #2fae8e);
    --moments-purple: var(--moments-theme-purple, #8a6be0);
    --moments-pink: var(--moments-theme-pink, #d45d93);
    --moments-sun: var(--moments-theme-sun, #f2a33a);
    --moments-moon: var(--moments-theme-moon, #c9cfdb);
    --moments-cloud: var(--moments-theme-cloud, #b9bfca);
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

/** A card's own panel, heading row and small uppercase labels. */
export const panel = css`
  :host {
    display: block;
    container-type: inline-size;
  }
  .panel {
    background: var(--moments-tile);
    color: var(--moments-fg);
    border-radius: var(--moments-radius);
    padding: 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 14px;
  }
  .head {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    gap: 12px;
  }
  h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: -0.01em;
  }
  .sub {
    font-size: 13px;
    color: var(--moments-muted);
  }
  .label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--moments-muted);
  }
  .num {
    font-variant-numeric: tabular-nums;
  }
  .stat {
    border-radius: var(--moments-inner-radius);
    background: var(--moments-raised);
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }
  .stat .k {
    font-size: 12px;
    font-weight: 600;
    color: var(--moments-muted);
  }
  .stat .v {
    font-size: 17px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
    white-space: nowrap;
  }
  .row {
    display: grid;
    align-items: center;
    gap: 10px;
    min-height: 44px;
    border-top: 1px solid var(--moments-line);
    font-variant-numeric: tabular-nums;
  }
  .pill {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    height: 30px;
    padding: 0 12px;
    border-radius: 999px;
    background: var(--moments-raised);
    font-size: 13px;
    font-weight: 700;
    white-space: nowrap;
  }
  .pill.ok {
    background: var(--moments-ok-soft);
    color: var(--moments-ok);
  }
  .pill.alert {
    background: var(--moments-alert-soft);
    color: var(--moments-alert);
  }
  .pill.dark {
    background: color-mix(in srgb, var(--moments-purple) 18%, transparent);
    color: var(--moments-purple);
  }
  .pill i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
  }
  .empty {
    color: var(--moments-muted);
    font-size: 14px;
  }
  svg.chart {
    width: 100%;
    height: auto;
    display: block;
    overflow: visible;
  }
  svg.chart text {
    fill: var(--moments-muted);
    font-size: 12px;
    font-family: inherit;
  }
  svg.chart .grid {
    stroke: var(--moments-line);
    stroke-width: 1;
  }
`;

