// Coloured weather icons for HA's weather conditions, drawn on a 48-unit grid.

import { css, html, svg, type SVGTemplateResult } from "lit";

const cloudHigh = svg`<path class="cloud" d="M13 30h22a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 13 30z"/>`;
const cloudLow = svg`<path class="cloud" d="M13 36h22a9 9 0 0 0 0-18 12 12 0 0 0-23 4A7 7 0 0 0 13 36z"/>`;
const sun = svg`<circle class="sun" cx="24" cy="24" r="9"/><g class="rays"><path d="M24 5v5M24 38v5M5 24h5M38 24h5M10.6 10.6l3.5 3.5M33.9 33.9l3.5 3.5M10.6 37.4l3.5-3.5M33.9 14.1l3.5-3.5"/></g>`;
const smallSun = svg`<circle class="sun" cx="18" cy="17" r="8"/><g class="rays"><path d="M18 3v3M6.7 7.7l2.1 2.1M3 17h3M29.3 7.7l-2.1 2.1"/></g>`;
const partCloud = svg`<path class="cloud" d="M16 38h20a8 8 0 0 0 0-16 11 11 0 0 0-21 3.5A6.3 6.3 0 0 0 16 38z"/>`;
const moon = svg`<path class="moon" d="M30 8a16 16 0 1 0 10 26A13 13 0 0 1 30 8z"/>`;
const drops = svg`<g class="rain"><path d="M17 35l-2 6M25 35l-2 6M33 35l-2 6"/></g>`;
const heavyDrops = svg`<g class="rain"><path d="M15 35l-2 7M21 35l-2 7M27 35l-2 7M33 35l-2 7"/></g>`;
const flakes = svg`<g class="snow"><circle cx="16" cy="38" r="2"/><circle cx="24" cy="42" r="2"/><circle cx="32" cy="38" r="2"/></g>`;
const hail = svg`<g class="hail"><circle cx="16" cy="38" r="2.6"/><circle cx="24" cy="42" r="2.6"/><circle cx="32" cy="38" r="2.6"/></g>`;
const bolt = svg`<path class="bolt" d="M25 31l-5 8h5l-3 7 8-10h-5l3-5z"/>`;
const fog = svg`<g class="fog"><path d="M10 36h28M14 42h20"/></g>`;
const wind = svg`<g class="wind"><path d="M6 18h24a5 5 0 1 0-5-5M6 26h32a5 5 0 1 1-5 5M6 34h16"/></g>`;
const alert = svg`<path class="bolt" d="M24 6l20 36H4z"/><path class="alert-mark" d="M24 19v11M24 35v1"/>`;

const SHAPES: Record<string, SVGTemplateResult[]> = {
  sunny: [sun],
  "clear-night": [moon],
  partlycloudy: [smallSun, partCloud],
  cloudy: [cloudLow],
  fog: [cloudHigh, fog],
  rainy: [cloudHigh, drops],
  pouring: [cloudHigh, heavyDrops],
  lightning: [cloudHigh, bolt],
  "lightning-rainy": [cloudHigh, drops, bolt],
  snowy: [cloudHigh, flakes],
  "snowy-rainy": [cloudHigh, drops, flakes],
  hail: [cloudHigh, hail],
  windy: [wind],
  "windy-variant": [cloudHigh, wind],
  exceptional: [alert],
};

/** The icon for an HA weather condition; unknown conditions get a plain cloud. */
export const weatherIcon = (condition: string | undefined, size = 28, label?: string) =>
  html`<svg class="wx" width=${size} height=${size} viewBox="0 0 48 48" role="img" aria-label=${label ?? condition ?? "weather"}>
    ${SHAPES[condition ?? ""] ?? [cloudLow]}
  </svg>`;

export const weatherIconStyles = css`
  .wx {
    flex: none;
    overflow: visible;
  }
  .wx .sun {
    fill: var(--moments-sun);
  }
  .wx .rays {
    stroke: var(--moments-sun);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .wx .moon {
    fill: var(--moments-moon);
  }
  .wx .cloud {
    fill: var(--moments-cloud);
  }
  .wx .rain {
    stroke: var(--moments-blue);
    stroke-width: 3;
    stroke-linecap: round;
  }
  .wx .snow,
  .wx .hail {
    fill: var(--moments-blue);
  }
  .wx .bolt {
    fill: var(--moments-sun);
  }
  .wx .alert-mark {
    stroke: var(--moments-on-fg);
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .wx .fog,
  .wx .wind {
    fill: none;
    stroke: var(--moments-cloud);
    stroke-width: 3;
    stroke-linecap: round;
  }
`;
