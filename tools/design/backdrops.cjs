// Moments backdrops: lightweight SVG wallpapers (gradients and thin lines only, no filters) in light and dark.
const W = 1600, H = 1200;
const wrap = (id, defs, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice" width="${W}" height="${H}"><defs>${defs}</defs>${body}</svg>`;
const rad = (id, c, op, cx, cy, r) => `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}"><stop offset="0" stop-color="${c}" stop-opacity="${op}"/><stop offset=".5" stop-color="${c}" stop-opacity="${(op * .45).toFixed(2)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`;
const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const blobs = (pfx, base, list) => {
  const defs = lin(`${pfx}b`, base, .4, 1) + list.map(([c, op, cx, cy, r], i) => rad(`${pfx}${i}`, c, op, cx, cy, r)).join('');
  const body = `<rect width="${W}" height="${H}" fill="url(#${pfx}b)"/>` + list.map((_, i) => `<rect width="${W}" height="${H}" fill="url(#${pfx}${i})"/>`).join('');
  return wrap(pfx, defs, body);
};

function mist(dark) {
  return dark
    ? blobs('mi', [[0, '#12161D'], [1, '#0B0D12']], [['#3A4A63', .45, 300, 150, 900], ['#1E3A4A', .35, 1400, 1100, 900]])
    : blobs('mi', [[0, '#F4F6F9'], [1, '#E7EBF1']], [['#FFFFFF', .9, 300, 150, 900], ['#D5E3F2', .7, 1400, 1100, 900]]);
}
function aurora(dark) {
  return dark
    ? blobs('au', [[0, '#0D1017'], [1, '#090B10']], [['#164B5E', .55, 250, 200, 800], ['#33246A', .5, 1350, 300, 850], ['#4A2E14', .4, 800, 1250, 900]])
    : blobs('au', [[0, '#F6F5F8'], [1, '#EEF0F4']], [['#FFD8C4', .75, 250, 150, 800], ['#DCD5FF', .75, 1350, 300, 850], ['#C9EEDF', .75, 800, 1250, 900]]);
}
function horizon(dark) {
  const sky = dark ? [[0, '#090C14'], [.55, '#121A2B'], [1, '#1F1B2C']] : [[0, '#F3F6FA'], [.55, '#E9EFF6'], [1, '#F6ECE4']];
  const hills = dark ? ['#161C29', '#131824', '#0F131C'] : ['#E4EAF1', '#DCE3EC', '#D3DBE6'];
  const glow = dark ? rad('hzg', '#5A4A7A', .35, 1150, 860, 700) : rad('hzg', '#FFE6CF', .8, 1150, 860, 700);
  const wave = (y, a, f, ph) => { let d = `M0 ${H}V${y}`; for (let x = 0; x <= W; x += 40) d += `L${x} ${(y + a * Math.sin(x / f + ph) + a * .5 * Math.sin(x / (f * .37) + ph * 2)).toFixed(1)}`; return d + `V${H}Z`; };
  let body = `<rect width="${W}" height="${H}" fill="url(#hzs)"/><rect width="${W}" height="${H}" fill="url(#hzg)"/>`;
  body += `<path d="${wave(880, 40, 260, 1)}" fill="${hills[0]}"/><path d="${wave(960, 34, 210, 2.2)}" fill="${hills[1]}"/><path d="${wave(1050, 26, 170, .4)}" fill="${hills[2]}"/>`;
  if (dark) {
    let r = 7; const rnd = () => (r = (r * 9301 + 49297) % 233280) / 233280;
    for (let i = 0; i < 70; i++) body += `<circle cx="${(rnd() * W).toFixed(0)}" cy="${(rnd() * 650).toFixed(0)}" r="${(0.8 + rnd() * 1.4).toFixed(1)}" fill="#fff" opacity="${(0.12 + rnd() * .35).toFixed(2)}"/>`;
  }
  return wrap('hz', lin('hzs', sky) + glow, body);
}
function contour(dark) {
  const base = dark ? [[0, '#11141A'], [1, '#0C0E13']] : [[0, '#F5F6F8'], [1, '#ECEEF2']];
  const stroke = dark ? '#FFFFFF' : '#1B2230';
  const centres = [[380, 330, 23], [1250, 860, 26], [1350, 180, 12]];
  let paths = '';
  for (const [cx, cy, n] of centres) {
    for (let k = 1; k <= n; k++) {
      const R = k * 34; let d = '';
      for (let a = 0; a <= 360; a += 6) {
        const t = a * Math.PI / 180;
        const rr = R * (1 + .14 * Math.sin(3 * t + k * .25 + cx) + .07 * Math.sin(5 * t - k * .18 + cy));
        d += `${a ? 'L' : 'M'}${(cx + rr * Math.cos(t)).toFixed(1)} ${(cy + rr * .78 * Math.sin(t)).toFixed(1)}`;
      }
      paths += `<path d="${d}Z" stroke-opacity="${k % 5 === 0 ? (dark ? .09 : .085) : (dark ? .045 : .045)}"/>`;
    }
  }
  return wrap('co', lin('cob', base, .4, 1), `<rect width="${W}" height="${H}" fill="url(#cob)"/><g fill="none" stroke="${stroke}" stroke-width="1.4">${paths}</g>`);
}

const BACKDROPS = [
  { key: 'mist', name: 'Mist', note: 'A barely-there gradient with soft light from the top left. The quietest option, closest to a plain background.', fn: mist },
  { key: 'aurora', name: 'Aurora', note: 'Three soft washes of colour (peach, lilac, mint by day; teal, violet, amber at night). The Glow icons feel at home here.', fn: aurora },
  { key: 'horizon', name: 'Horizon', note: 'A pale sky over low, layered hills, with a sunset glow and faint stars in dark mode. A sense of place without a photo.', fn: horizon },
  { key: 'contour', name: 'Contour', note: 'Fine topographic lines on a flat ground. Texture without colour, so state colours stay the loudest thing on screen.', fn: contour },
];
module.exports = { BACKDROPS };
