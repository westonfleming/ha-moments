// Source of the Moments icons. Run `npm run assets` after editing; it rewrites src/icons/generated.ts.
// Moments icon generator: shared geometry, two paint directions (glow = soft dimensional, crisp = flat colour).
const CSS = `.hm-breathe{animation:hm-breathe 3.2s ease-in-out infinite}
@keyframes hm-breathe{0%,100%{opacity:.6}50%{opacity:1}}
.hm-rays{animation:hm-rays 3.2s ease-in-out infinite}
@keyframes hm-rays{0%,100%{opacity:.55;transform:scale(.94)}50%{opacity:1;transform:scale(1.05)}}
.hm-spin{animation:hm-spin 1.3s linear infinite}
.hm-spin-slow{animation:hm-spin 12s linear infinite}
@keyframes hm-spin{to{transform:rotate(360deg)}}
.hm-shake{animation:hm-shake 1.8s ease-in-out infinite}
@keyframes hm-shake{0%,55%,100%{transform:translateX(0)}60%,70%{transform:translateX(-1.8px)}65%,75%{transform:translateX(1.8px)}80%{transform:translateX(0)}}
.hm-flicker{animation:hm-flicker 1.2s ease-in-out infinite alternate}
@keyframes hm-flicker{0%{transform:scale(1,1)}50%{transform:scale(.93,1.07)}100%{transform:scale(1.05,.95)}}
.hm-bob{animation:hm-bob 2.4s ease-in-out infinite}
@keyframes hm-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-2px)}}
.hm-roll{animation:hm-roll 3s ease-in-out infinite}
@keyframes hm-roll{0%,12%{transform:scaleY(1)}82%,100%{transform:scaleY(.12)}}
.hm-rollbar{animation:hm-rollbar 3s ease-in-out infinite}
@keyframes hm-rollbar{0%,12%{transform:translateY(0)}82%,100%{transform:translateY(-32.56px)}}
.hm-shade,.hm-bar{transition:transform 1.1s cubic-bezier(.45,.05,.3,1)}
.hm-flow{animation:hm-flow 1.4s linear infinite}
@keyframes hm-flow{to{stroke-dashoffset:-22.8}}
.hm-swing{animation:hm-swing 4s ease-in-out infinite}
@keyframes hm-swing{0%,100%{transform:scaleX(1)}50%{transform:scaleX(.86)}}
.hm-drip{animation:hm-drip .5s linear infinite}
@keyframes hm-drip{to{stroke-dashoffset:-8}}
.hm-steam{animation:hm-steam 1.8s ease-out infinite}
@keyframes hm-steam{0%{transform:translateY(2px);opacity:0}35%{opacity:.9}100%{transform:translateY(-5px);opacity:0}}
.hm-tumble{animation:hm-spin 2.4s cubic-bezier(.55,.1,.45,.9) infinite}
.hm-ping{animation:hm-ping 3s ease-out infinite}
@keyframes hm-ping{0%{transform:scale(.95);opacity:.9}100%{transform:scale(1.45);opacity:0}}
.hm-twinkle{animation:hm-twinkle 2.4s ease-in-out infinite}
@keyframes hm-twinkle{0%,100%{opacity:.25}50%{opacity:1}}
.hm-rise{animation:hm-rise 2.4s ease-in-out infinite alternate}
@keyframes hm-rise{from{transform:scaleY(.94)}to{transform:scaleY(1.02)}}
.hm-drip2{animation:hm-drip2 1.6s ease-in infinite}
@keyframes hm-drip2{0%{transform:translateY(-3px);opacity:0}30%{opacity:1}100%{transform:translateY(3px);opacity:0}}
.hm-spray{animation:hm-spray .9s ease-in infinite}
@keyframes hm-spray{0%{transform:translateY(0);opacity:0}25%{opacity:1}100%{transform:translateY(9px);opacity:0}}
.hm-bubble{animation:hm-bubble 2s ease-out infinite}
@keyframes hm-bubble{0%{transform:translateY(0);opacity:0}30%{opacity:1}100%{transform:translateY(-8px);opacity:0}}
@media (prefers-reduced-motion:reduce){[class*="hm-"]{animation:none!important}}`;

function painter(mode, pfx) {
  const soft = mode === 'glow';
  const defs = [];
  const id = n => `${pfx}-${n}`;
  const stops = s => s.map(([o, c, op]) => `<stop offset="${o}" stop-color="${c}"${op != null ? ` stop-opacity="${op}"` : ''}/>`).join('');
  return {
    soft, defs,
    lg(n, s, flat, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
      if (!soft) return flat;
      defs.push(`<linearGradient id="${id(n)}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`);
      return `url(#${id(n)})`;
    },
    rg(n, s, flat, cx = .5, cy = .5, r = .5) {
      if (!soft) return flat;
      defs.push(`<radialGradient id="${id(n)}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient>`);
      return `url(#${id(n)})`;
    },
    // soft: radial glow; crisp: flat tinted disc
    halo(n, c, cx, cy, r, op, cls = 'hm-breathe') {
      if (!soft) return '';
      defs.push(`<radialGradient id="${id(n)}"><stop offset="0" stop-color="${c}" stop-opacity="${op}"/><stop offset=".55" stop-color="${c}" stop-opacity="${(op * .35).toFixed(2)}"/><stop offset="1" stop-color="${c}" stop-opacity="0"/></radialGradient>`);
      return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${id(n)})" class="${cls}"/>`;
    },
    hi(markup) { return soft ? markup : ''; },
  };
}

const LINE = 'rgba(40,48,62,.22)';
const o = (x, y) => `style="transform-origin:${x}px ${y}px"`;

// ---------- Light ----------
function light(s, P) {
  const dim = s === 'dim', on = s !== 'off';
  const glass = s === 'on' ? P.rg('glass', [[0, '#FFFBEA'], [.45, '#FFD45E'], [1, '#F59E0B']], '#FFC53D', .4, .32, .75)
    : dim ? P.rg('glass', [[0, '#FCEFD0'], [.5, '#E9BC6C'], [1, '#B98234']], '#E3B060', .4, .32, .75)
    : P.rg('glass', [[0, '#FBFCFD'], [.55, '#DDE2E8'], [1, '#A9B2BE']], '#D3D9E0', .4, .32, .75);
  const metal = P.lg('metal', [[0, '#DDE2E8'], [.5, '#9BA4B0'], [1, '#6A7380']], '#99A2AE', 0, 0, 1, 0);
  const fil = s === 'on' ? '#FFFDF2' : dim ? '#FFF3D6' : '#8C95A1';
  let r = '';
  if (on) r += P.halo('halo', '#FFC23D', 32, 26, 30, dim ? .38 : .75);
  if (s === 'on') {
    const rays = [-180, -135, -90, -45, 0].map(a => {
      const t = a * Math.PI / 180, c = Math.cos(t), sn = Math.sin(t);
      return `<line x1="${(32 + 19 * c).toFixed(1)}" y1="${(25 + 19 * sn).toFixed(1)}" x2="${(32 + 24 * c).toFixed(1)}" y2="${(25 + 24 * sn).toFixed(1)}"/>`;
    }).join('');
    r += `<g class="hm-rays" ${o(32, 25)} stroke="#FFB020" stroke-width="2.6" stroke-linecap="round">${rays}</g>`;
  }
  r += `<path d="M22.5 36C18 32 17 28.5 17 25.5a15 15 0 0 1 30 0c0 3-1 6.5-5.5 10.5-2 2-2.5 4-2.5 6H25c0-2-.5-4-2.5-6Z" fill="${glass}"${on ? '' : ` stroke="${LINE}" stroke-width="1"`}/>`;
  r += P.hi(`<ellipse cx="24.8" cy="20" rx="3.2" ry="5.6" transform="rotate(-28 24.8 20)" fill="#fff" opacity="${on ? .75 : .9}"/>`);
  r += `<g fill="none" stroke="${fil}" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M27.5 32.5l2-5.5 2.5 4 2.5-4 2 5.5"/><path d="M28.4 33.5 28.8 42M35.6 33.5 35.2 42" opacity=".6"/></g>`;
  r += `<rect x="25" y="42" width="14" height="9" rx="2" fill="${metal}"/>`;
  r += `<path d="M25.5 45h13M25.5 48h13" stroke="#5B6370" stroke-opacity=".45" stroke-width="1"/>`;
  r += `<path d="M28 51h8l-1.6 3.2h-4.8Z" fill="#4A515D"/>`;
  return r;
}

// ---------- Lock ----------
function lock(s, P) {
  const body = {
    locked: [[[0, '#7BEDB2'], [.55, '#22B46A'], [1, '#128a4e']], '#22B46A'],
    unlocked: [[[0, '#FFDC80'], [.55, '#F7A51C'], [1, '#D07A08']], '#F7A51C'],
    jammed: [[[0, '#FFA293'], [.55, '#EF4438'], [1, '#BF241A']], '#EF4438'],
  }[s];
  const bf = P.lg('body', body[0], body[1]);
  const metal = P.lg('shackle', [[0, '#C2C9D2'], [.4, '#EEF1F4'], [1, '#8D96A2']], '#9AA3AF', 0, 0, 1, 0);
  const shackle = s === 'unlocked'
    ? `<g class="hm-bob"><path d="M41.5 30V15a9.5 9.5 0 0 0-19 0v4" fill="none" stroke="${metal}" stroke-width="5.5" stroke-linecap="round"/></g>`
    : `<path d="M22.5 30v-8a9.5 9.5 0 0 1 19 0v8" fill="none" stroke="${metal}" stroke-width="5.5" stroke-linecap="round"/>`;
  const glyph = s === 'jammed'
    ? `<rect x="30.3" y="34" width="3.4" height="10" rx="1.7" fill="#fff"/><circle cx="32" cy="48.6" r="2" fill="#fff"/>`
    : `<path d="M32 35.8a3.7 3.7 0 0 0-1.9 6.9L29 48.5h6l-1.1-5.8a3.7 3.7 0 0 0-1.9-6.9Z" fill="#000" fill-opacity=".3"/>`;
  let r = '';
  if (s === 'jammed') r += P.halo('halo', '#FF4B3A', 32, 38, 30, .55);
  if (s === 'locked') r += P.halo('halo', '#2EDB86', 32, 40, 28, .3, '');
  r += `<g${s === 'jammed' ? ' class="hm-shake"' : ''}>${shackle}`;
  r += `<rect x="13" y="28" width="38" height="27" rx="8" fill="${bf}"/>`;
  r += P.hi(`<rect x="16.5" y="30.5" width="31" height="6" rx="3" fill="#fff" opacity=".32"/>`);
  r += P.hi(`<rect x="13" y="28" width="38" height="27" rx="8" fill="none" stroke="#000" stroke-opacity=".08"/>`);
  r += glyph + `</g>`;
  return r;
}

// ---------- Door ----------
function door(s, P) {
  const frame = P.lg('frame', [[0, '#CCD3DC'], [1, '#939DAA']], '#A9B2BE');
  const df = P.lg('door', [[0, '#7AA6FF'], [.5, '#3F66E0'], [1, '#2B47B5']], '#3F66E0', 0, 0, 1, 1);
  const knob = P.rg('knob', [[0, '#FFF1C2'], [1, '#E9A417']], '#F5B524', .35, .35, .7);
  let r = `<rect x="13" y="7" width="38" height="52" rx="4" fill="${frame}"/>`;
  if (s === 'closed') {
    r += `<rect x="17" y="11" width="30" height="48" rx="1.5" fill="${df}"/>`;
    r += `<g fill="#fff" fill-opacity="${P.soft ? .1 : 0}" stroke="#fff" stroke-opacity=".3" stroke-width="1.5"><rect x="21" y="15" width="22" height="17" rx="1.5"/><rect x="21" y="36" width="22" height="19" rx="1.5"/></g>`;
    r += `<circle cx="41.5" cy="34" r="2.4" fill="${knob}"/>`;
  } else {
    const warm = P.rg('warm', [[0, '#FFF4CF'], [.5, '#FFC75A'], [1, '#F29C1F']], '#FFC95A', .55, .75, .9);
    r += `<rect x="17" y="11" width="30" height="48" rx="1.5" fill="${warm}"/>`;
    r += `<path d="M17 59h30l9 4H8Z" fill="#FFC24D" opacity="${P.soft ? .5 : .4}" class="hm-breathe"/>`;
    r += `<g class="hm-swing" ${o(17, 35)}><path d="M17 11 28.5 15.5v39L17 59Z" fill="${df}"/>`;
    r += `<path d="M28.5 15.5 30 16v38l-1.5.5Z" fill="#1F3592"/>`;
    r += `<path d="M19.5 15.5 26 18v12.5l-6.5-1Z" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.3"/>`;
    r += `<path d="M19.5 33.5 26 34.2v16.5l-6.5 2.6Z" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="1.3"/>`;
    r += `<circle cx="26.3" cy="35.5" r="1.9" fill="${knob}"/></g>`;
  }
  return r;
}

// ---------- Blind (roller cover) ----------
function blind(s, P) {
  const frame = P.lg('frame', [[0, '#F6F8FA'], [1, '#C5CCD6']], '#D9DEE5');
  const sky = P.lg('sky', [[0, '#8FD8FF'], [1, '#3A98E8']], '#56AEF0');
  const fabric = P.lg('fabric', [[0, '#FFF7EA'], [1, '#E4D4B8']], '#EBDDC4');
  const rail = P.lg('rail', [[0, '#707A89'], [1, '#434B57']], '#525B68');
  // s: '0'..'100' = % open (HA cover position), or 'opening' / 'closing' (looping move)
  const anim = s === 'opening' || s === 'closing';
  const pos = anim ? 0 : +s;
  const k = .12 + .88 * (1 - pos / 100);
  let r = `<rect x="9" y="9" width="46" height="46" rx="5" fill="${frame}" stroke="${LINE}"/>`;
  r += `<rect x="13" y="14" width="38" height="37" rx="2" fill="${sky}"/>`;
  r += P.halo('sun', '#FFE27A', 41, 25, 11, .9, '');
  r += `<circle cx="41" cy="25" r="5" fill="#FFD447"/>`;
  r += `<g fill="#fff" opacity=".95"><circle cx="21.5" cy="39" r="3.4"/><circle cx="26.5" cy="36.2" r="4.4"/><circle cx="31" cy="39.5" r="2.9"/><rect x="21.5" y="39" width="9.5" height="3.4"/></g>`;
  r += `<g fill="${frame}"><rect x="31.25" y="14" width="1.5" height="37"/><rect x="13" y="31.75" width="38" height="1.5"/></g>`;
  const tex = P.hi(Array.from({ length: 9 }, (_, i) => `<path d="M13 ${18 + i * 4}h38"/>`).join(''));
  const dirStyle = s === 'closing' ? 'animation-direction:reverse;' : '';
  const shadeT = anim ? `class="hm-roll" style="${dirStyle}transform-origin:32px 14px"` : `class="hm-shade" style="transform:translateY(14px) scaleY(${k.toFixed(3)}) translateY(-14px)"`;
  r += `<g ${shadeT}><rect x="13" y="14" width="38" height="37" fill="${fabric}"/><g stroke="#6B5434" stroke-opacity=".1">${tex}</g></g>`;
  const barT = anim ? `class="hm-rollbar" style="${dirStyle}"` : `class="hm-bar" style="transform:translateY(${(-37 * (1 - k)).toFixed(2)}px)"`;
  r += `<g ${barT}><rect x="12" y="49.5" width="40" height="3.2" rx="1.6" fill="#8A785F"/><path d="M45 52.7v4" stroke="#8A785F" stroke-width="1.2"/><circle cx="45" cy="57.4" r="1.4" fill="#8A785F"/></g>`;
  r += `<rect x="8" y="8" width="48" height="7" rx="3.5" fill="${rail}"/>`;
  r += P.hi(`<rect x="10" y="9" width="44" height="2" rx="1" fill="#fff" opacity=".22"/>`);
  return r;
}

// ---------- Thermostat ----------
function thermostat(s, P) {
  const C = 2 * Math.PI * 23.75, track = .75 * C;
  const arcCfg = {
    heat: [[[0, '#FFC75E'], [.5, '#FF6A3D'], [1, '#E5302E']], '#FF6237', .64, '#FF7A35'],
    cool: [[[0, '#86F2FF'], [.5, '#3AA0FF'], [1, '#4357FF']], '#3A8DFF', .42, '#3AA0FF'],
    idle: [[[0, '#B4F3CF'], [1, '#33C27F']], '#33C27F', .55, null],
    off: [null, null, 0, null],
  }[s];
  const bezel = P.lg('bezel', [[0, '#FBFCFD'], [1, '#C0C8D2']], '#DCE1E7');
  const face = P.lg('face', [[0, '#2C3443'], [1, '#10141B']], '#1D232E');
  let r = '';
  if (arcCfg[3]) r += P.halo('halo', arcCfg[3], 32, 32, 32, .5);
  r += `<circle cx="32" cy="32" r="28" fill="${bezel}" stroke="${LINE}"/>`;
  r += P.hi(`<path d="M10 28a22 22 0 0 1 44 0" fill="none" stroke="#fff" stroke-width="2" opacity=".7"/>`);
  r += `<circle cx="32" cy="32" r="23.75" fill="none" stroke="#2A3240" stroke-opacity=".13" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${track.toFixed(2)} ${C.toFixed(2)}" transform="rotate(135 32 32)"/>`;
  if (arcCfg[0]) {
    const ag = P.lg('arc', arcCfg[0], arcCfg[1], 0, 1, 1, 0);
    r += `<circle cx="32" cy="32" r="23.75" fill="none" stroke="${ag}" stroke-width="4.5" stroke-linecap="round" stroke-dasharray="${(track * arcCfg[2]).toFixed(2)} ${C.toFixed(2)}" transform="rotate(135 32 32)"/>`;
  }
  r += `<circle cx="32" cy="32" r="19.5" fill="${face}"/>`;
  r += P.hi(`<ellipse cx="32" cy="22" rx="13" ry="6" fill="#fff" opacity=".07"/>`);
  if (s === 'heat') {
    const fl = P.lg('flame', [[0, '#FFD66E'], [.55, '#FF7A2E'], [1, '#EE3F2A']], '#FF6A2E');
    r += `<g class="hm-flicker" ${o(32, 42)}><path d="M32 20.5c3.5 5 8 7.5 8 13.5 0 4.6-3.6 8-8 8s-8-3.4-8-8c0-3.5 2-5.8 3.8-8 .4 2.4 1.4 3.8 2.8 4.4-.4-3.4.2-6.8 1.4-9.9Z" fill="${fl}"/><path d="M32 30.5c2.2 2.1 4 3.7 4 6.3 0 2.3-1.8 3.8-4 3.8s-4-1.5-4-3.8c0-2.2 2-3.8 4-6.3Z" fill="#FFEBA3"/></g>`;
  } else if (s === 'cool') {
    let arms = '';
    for (let a = 0; a < 360; a += 60) {
      const t = a * Math.PI / 180, u = [Math.cos(t), Math.sin(t)];
      const e = [32 + 10.5 * u[0], 32 + 10.5 * u[1]], p = [32 + 6.2 * u[0], 32 + 6.2 * u[1]];
      arms += `<path d="M32 32L${e[0].toFixed(2)} ${e[1].toFixed(2)}"/>`;
      for (const d of [-50, 50]) {
        const tt = (a + d) * Math.PI / 180;
        arms += `<path d="M${p[0].toFixed(2)} ${p[1].toFixed(2)}l${(3.4 * Math.cos(tt)).toFixed(2)} ${(3.4 * Math.sin(tt)).toFixed(2)}"/>`;
      }
    }
    r += `<g class="hm-spin-slow" ${o(32, 32)} fill="none" stroke="#BDEBFF" stroke-width="2" stroke-linecap="round">${arms}</g>`;
  } else if (s === 'idle') {
    const lf = P.lg('leaf', [[0, '#A8F2C8'], [1, '#2DBE76']], '#3DCB85', 0, 1, 1, 0);
    r += `<g class="hm-breathe"><path d="M23.5 40.5c-.5-10.5 5.5-16.5 17.5-17 .5 11.5-6 17.5-17.5 17Z" fill="${lf}"/><path d="M25.5 38.5 36.5 27.5" stroke="#10141B" stroke-opacity=".35" stroke-width="1.4" stroke-linecap="round"/></g>`;
  } else {
    r += `<g fill="none" stroke="#7D8794" stroke-width="2.6" stroke-linecap="round"><path d="M27.2 27.2a7.6 7.6 0 1 0 9.6 0"/><path d="M32 23.5v8"/></g>`;
  }
  return r;
}

// ---------- Plug ----------
function plug(s, P) {
  const on = s === 'on';
  const body = P.lg('body', [[0, '#FFFFFF'], [1, '#D8DEE6']], '#EEF1F5');
  const face = P.lg('face', [[0, '#DCE1E8'], [1, '#F8F9FB']], '#E1E6EC');
  let r = '';
  if (on) r += P.halo('halo', '#2EE07F', 32, 32, 31, .42);
  r += `<rect x="11" y="13.5" width="42" height="42" rx="12" fill="#AEB7C3"/>`;
  r += `<rect x="11" y="11" width="42" height="42" rx="12" fill="${body}" stroke="${LINE}"/>`;
  r += `<circle cx="32" cy="34" r="12" fill="${face}"/>`;
  r += `<g fill="#3A414D"><circle cx="27.5" cy="34" r="2.2"/><circle cx="36.5" cy="34" r="2.2"/></g>`;
  r += `<rect x="27" y="16" width="10" height="3" rx="1.5" fill="${on ? '#22D877' : '#A3ACB8'}"/>`;
  if (on) {
    r += `<circle cx="32" cy="34" r="14.5" fill="none" stroke="#22C86E" stroke-width="2" stroke-linecap="round" stroke-dasharray="6.4 5" class="hm-flow"/>`;
    const bolt = P.lg('bolt', [[0, '#FFE77F'], [1, '#FFAE1A']], '#FFC233');
    r += `<circle cx="46" cy="46" r="8" fill="${bolt}" stroke="#fff" stroke-width="2"/><path d="M46.9 41.3 42.6 47h3.4l-.9 3.7 4.3-5.7H46Z" fill="#7A4A00"/>`;
  }
  return r;
}

// ---------- Fan ----------
function fan(s, P) {
  const on = s === 'on';
  const housing = P.lg('housing', [[0, '#F8FAFB'], [1, '#C6CED8']], '#DCE1E7');
  const well = P.lg('well', [[0, '#DFE4EB'], [1, '#F6F8FA']], '#E7EBF0');
  const blade = on ? P.lg('blade', [[0, '#86F3DA'], [.5, '#22B8AF'], [1, '#1487A5']], '#20B2AC')
    : P.lg('blade', [[0, '#DCE1E8'], [1, '#A7B0BC']], '#B4BCC7');
  const hub = P.lg('hub', [[0, '#FFFFFF'], [1, '#C6CED8']], '#F3F5F7');
  const one = `<path d="M32 32c-3.5-5.5-5.5-15 .5-20 5 1.5 6 10-.5 20Z" fill="${blade}"/>`;
  let r = '';
  if (on) r += P.halo('halo', '#2CD3C0', 32, 32, 31, .4);
  r += `<circle cx="32" cy="32" r="27" fill="${housing}" stroke="${LINE}"/>`;
  r += `<circle cx="32" cy="32" r="22.5" fill="${well}"/>`;
  if (on && P.soft) r += `<circle cx="32" cy="32" r="20" fill="#22B8AF" opacity=".1"/>`;
  r += `<g${on ? ` class="hm-spin" ${o(32, 32)}` : ''}>${[0, 120, 240].map(a => `<g transform="rotate(${a} 32 32)">${one}</g>`).join('')}</g>`;
  r += `<circle cx="32" cy="32" r="5" fill="${hub}" stroke="${LINE}"/><circle cx="32" cy="32" r="1.6" fill="#8A939F"/>`;
  return r;
}


// ---------- shared appliance bits ----------
const whiteBody = (P, n = 'body') => P.lg(n, [[0, '#FFFFFF'], [1, '#D6DCE4']], '#EEF1F5');
const metalH = (P, n = 'metal') => P.lg(n, [[0, '#DDE2E8'], [.5, '#9BA4B0'], [1, '#6A7380']], '#99A2AE', 0, 0, 1, 0);
const checkBadge = (cx, cy) => `<circle cx="${cx}" cy="${cy}" r="7.5" fill="#22B46A" stroke="#fff" stroke-width="2"/><path d="M${cx - 3.2} ${cy}l2.2 2.3 4.2-4.6" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
const alertBadge = (cx, cy, c = '#EF4438') => `<circle cx="${cx}" cy="${cy}" r="7.5" fill="${c}" stroke="#fff" stroke-width="2"/><rect x="${cx - 1.2}" y="${cy - 4.3}" width="2.4" height="5.4" rx="1.2" fill="#fff"/><circle cx="${cx}" cy="${cy + 3.2}" r="1.3" fill="#fff"/>`;
function flake(cx, cy, R, color, w = 1.8) {
  let a = '';
  for (let d = 0; d < 360; d += 60) {
    const t = d * Math.PI / 180, u = [Math.cos(t), Math.sin(t)];
    a += `<path d="M${cx} ${cy}L${(cx + R * u[0]).toFixed(2)} ${(cy + R * u[1]).toFixed(2)}"/>`;
    const p = [cx + R * .6 * u[0], cy + R * .6 * u[1]];
    for (const s of [-50, 50]) { const tt = (d + s) * Math.PI / 180; a += `<path d="M${p[0].toFixed(2)} ${p[1].toFixed(2)}l${(R * .33 * Math.cos(tt)).toFixed(2)} ${(R * .33 * Math.sin(tt)).toFixed(2)}"/>`; }
  }
  return `<g fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round">${a}</g>`;
}

// ---------- Coffee machine ----------
function coffee(s, P) {
  const on = s !== 'off';
  const body = P.lg('body', [[0, '#545D6E'], [1, '#232933']], '#373E4A');
  const metal = metalH(P);
  const cup = P.lg('cup', [[0, '#FFFFFF'], [1, '#D9DEE5']], '#F3F5F7', 0, 0, 1, 0);
  let r = '';
  if (s === 'brewing') r += P.halo('halo', '#FFB25B', 32, 36, 31, .45);
  r += `<rect x="13" y="7" width="38" height="50" rx="7" fill="${body}"/>`;
  r += P.hi(`<rect x="16" y="9" width="32" height="4" rx="2" fill="#fff" opacity=".12"/>`);
  r += `<circle cx="44" cy="14" r="2" fill="${s === 'brewing' ? '#FFB020' : s === 'ready' ? '#22D877' : '#6B7482'}"/>`;
  r += `<rect x="18" y="19" width="28" height="7" rx="2.5" fill="${metal}"/><rect x="29" y="26" width="6" height="3.5" rx="1" fill="#1A1F27"/>`;
  r += `<rect x="16" y="51" width="32" height="4" rx="2" fill="${metal}"/>`;
  if (s === 'brewing') r += `<path d="M32 29.5V39" stroke="#9A5A2B" stroke-width="1.8" stroke-linecap="round" stroke-dasharray="2.2 1.8" class="hm-drip"/>`;
  r += `<path d="M38 41.5h1.6a3.2 3.2 0 0 1 0 6.4H37" fill="none" stroke="#E6EAEF" stroke-width="2"/>`;
  r += `<path d="M24 39h14v6a6 6 0 0 1-6 6h-2a6 6 0 0 1-6-6Z" fill="${cup}"/>`;
  if (on) r += `<rect x="24.8" y="39.6" width="12.4" height="2" rx="1" fill="#7A4220"/>`;
  if (s === 'ready') {
    r += `<g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".85"><path class="hm-steam" d="M28.5 36c-1.5-1.6 1.5-3 0-4.8"/><path class="hm-steam" style="animation-delay:-.9s" d="M33 36c-1.5-1.6 1.5-3 0-4.8"/></g>`;
  }
  return r;
}

// ---------- Washer / dryer ----------
function laundry(kind) {
  return function (s, P) {
    const run = s === 'running', done = s === 'done';
    const dry = kind === 'dryer';
    const ring = P.lg('ring', [[0, '#EEF1F4'], [1, '#98A1AD']], '#B4BCC7', 0, 0, 1, 1);
    const glass = run ? (dry ? P.rg('glass', [[0, '#FFF0D8'], [.6, '#FFC98A'], [1, '#EE9440']], '#FFBE7A', .4, .35, .7)
      : P.rg('glass', [[0, '#C9EEFF'], [.6, '#6EC0F5'], [1, '#2D7FD8']], '#62B5F0', .4, .35, .7))
      : P.rg('glass', [[0, '#F2F5F8'], [1, '#B9C2CC']], '#D2D8E0', .4, .35, .7);
    const led = run ? (dry ? '#FF9A3D' : '#36C8FF') : done ? '#22D877' : '#A3ACB8';
    let r = '';
    if (run) r += P.halo('halo', dry ? '#FFA94D' : '#3AB0FF', 32, 37, 30, .4);
    r += `<rect x="11" y="9.5" width="42" height="50" rx="7" fill="#AEB7C3"/>`;
    r += `<rect x="11" y="7" width="42" height="50" rx="7" fill="${whiteBody(P)}" stroke="${LINE}"/>`;
    r += `<path d="M11 18.5h42" stroke="${LINE}"/>`;
    r += `<circle cx="18.5" cy="12.8" r="2.6" fill="${metalH(P)}"/>`;
    r += `<rect x="33" y="10.3" width="15" height="5" rx="1.6" fill="#1D232E"/><rect x="35" y="12" width="${run ? 8 : done ? 11 : 4}" height="1.6" rx=".8" fill="${led}"/>`;
    if (dry) r += `<g fill="#9AA3AF"><rect x="23" y="11.5" width="6" height="1.2" rx=".6"/><rect x="23" y="14" width="6" height="1.2" rx=".6"/></g>`;
    r += `<circle cx="32" cy="37" r="14.5" fill="${ring}"/><circle cx="32" cy="37" r="10.8" fill="${glass}"/>`;
    if (run) {
      const clothes = dry
        ? `<ellipse cx="32" cy="31" rx="4" ry="2.4" fill="#FF7A8A"/><ellipse cx="37" cy="40" rx="3.4" ry="2.2" fill="#7C5CFF" transform="rotate(40 37 40)"/><ellipse cx="27" cy="40" rx="3.4" ry="2.2" fill="#FFD166" transform="rotate(-40 27 40)"/>`
        : `<circle cx="32" cy="31.5" r="2.6" fill="#FF7A8A"/><circle cx="37" cy="39.5" r="2.4" fill="#FFD166"/><circle cx="27" cy="39.5" r="2.4" fill="#7C5CFF"/>`;
      r += `<g class="${dry ? 'hm-tumble' : 'hm-spin'}" ${o(32, 37)}>${clothes}</g>`;
      if (!dry) r += `<path d="M21.6 39.5c3.4-1.6 6.8 1.6 10.4 0s7-1.6 10.4 0a10.8 10.8 0 0 1-20.8 0Z" fill="#1F6FC9" opacity=".45"/>`;
      else r += `<g fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8" class="hm-breathe"><path d="M28 47c-1-1.2 1-2.2 0-3.4M32 47.5c-1-1.2 1-2.2 0-3.4M36 47c-1-1.2 1-2.2 0-3.4"/></g>`;
    }
    r += P.hi(`<path d="M24.5 31a10 10 0 0 1 9-4.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".75"/>`);
    if (done) r += checkBadge(47, 49);
    return r;
  };
}

// ---------- Fridge ----------
function fridge(s, P) {
  const open = s === 'open';
  const body = whiteBody(P);
  const metal = metalH(P);
  let r = '';
  if (open) r += P.halo('halo', '#7FD3FF', 32, 40, 30, .55);
  r += `<rect x="16" y="7.5" width="32" height="54" rx="6" fill="#AEB7C3"/>`;
  r += `<rect x="16" y="5" width="32" height="54" rx="6" fill="${body}" stroke="${LINE}"/>`;
  r += `<path d="M16 23h32" stroke="${LINE}" stroke-width="1.2"/>`;
  r += `<rect x="20" y="10" width="2.6" height="9" rx="1.3" fill="${metal}"/>`;
  if (!open) {
    r += `<rect x="20" y="27" width="2.6" height="14" rx="1.3" fill="${metal}"/>`;
    r += `<rect x="33" y="27" width="11" height="6" rx="2" fill="#1D232E"/>${flake(38.5, 30, 2.2, '#5CC4FF', 1)}`;
    r += P.hi(`<rect x="44.5" y="8" width="1.6" height="48" rx=".8" fill="#fff" opacity=".7"/>`);
  } else {
    const inside = P.lg('inside', [[0, '#F7FCFF'], [1, '#BFE3FF']], '#DDF1FF');
    r += `<rect x="16.5" y="23.5" width="31" height="35" rx="1" fill="${inside}"/>`;
    r += `<g stroke="#9CC9EA" stroke-width="1.2"><path d="M17 35h30M17 46h30"/></g>`;
    r += `<rect x="20" y="27.5" width="4" height="7.5" rx="1.4" fill="#4FB37A"/><rect x="26" y="29.5" width="6" height="5.5" rx="1.2" fill="#FFB547"/><rect x="36" y="26.5" width="3.4" height="8.5" rx="1.4" fill="#FF6B6B"/>`;
    r += `<rect x="22" y="40" width="9" height="6" rx="2" fill="#7AA6FF"/><circle cx="38" cy="43" r="3" fill="#FFD166"/>`;
    r += `<rect x="18" y="49" width="28" height="7" rx="2" fill="#CFE8FA"/>`;
    r += `<g class="hm-swing" ${o(16, 40)}><path d="M16 23 6 19.5v43L16 59Z" fill="${body}" stroke="${LINE}"/><rect x="8.5" y="35" width="2.2" height="12" rx="1.1" fill="${metal}"/></g>`;
    r += alertBadge(48, 52, '#F59E0B');
  }
  return r;
}

// ---------- Chest freezer ----------
function freezer(s, P) {
  const body = whiteBody(P);
  const lid = P.lg('lid', [[0, '#FFFFFF'], [1, '#E2E7ED']], '#F5F7F9');
  const metal = metalH(P);
  const led = s === 'ok' ? '#46B6FF' : s === 'open' ? '#FFB020' : '#FF4B3A';
  let r = '';
  if (s === 'warm') r += P.halo('halo', '#FF4B3A', 32, 38, 30, .45);
  if (s === 'open') r += P.halo('halo', '#7FD3FF', 32, 24, 26, .6);
  r += `<rect x="8" y="30.5" width="48" height="26" rx="6" fill="#AEB7C3"/>`;
  r += `<rect x="8" y="28" width="48" height="26" rx="6" fill="${body}" stroke="${LINE}"/>`;
  if (s === 'open') {
    r += `<path d="M10 28 14 7h36l4 21Z" fill="${lid}" stroke="${LINE}"/>`;
    r += `<path d="M14 9.5h36l3.4 17H10.6Z" fill="#DDF1FF"/>`;
    r += `<rect x="9" y="25.5" width="46" height="4" rx="1.5" fill="#BFE6FF"/>`;
    r += `<g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"><path class="hm-steam" d="M22 24c-1.5-1.6 1.5-3 0-4.8"/><path class="hm-steam" style="animation-delay:-.8s" d="M32 24c-1.5-1.6 1.5-3 0-4.8"/><path class="hm-steam" style="animation-delay:-1.6s" d="M42 24c-1.5-1.6 1.5-3 0-4.8"/></g>`;
  } else {
    r += `<rect x="6" y="22" width="52" height="8" rx="4" fill="${lid}" stroke="${LINE}"/>`;
    r += `<rect x="26" y="27.5" width="12" height="3" rx="1.5" fill="${metal}"/>`;
  }
  r += `<rect x="41" y="36" width="11" height="6" rx="2" fill="#1D232E"/><rect x="43" y="38.2" width="${s === 'ok' ? 4 : 7}" height="1.6" rx=".8" fill="${led}"/>`;
  if (s === 'ok') r += `<g class="hm-spin-slow" ${o(19, 41)}>${flake(19, 41, 5.5, '#46B6FF', 1.8)}</g>`;
  if (s === 'warm') r += `<g>${flake(19, 41, 5.5, '#FF8A7A', 1.8)}</g><path class="hm-drip2" d="M19 47.5c-1.4 2-2 3-2 4a2 2 0 0 0 4 0c0-1-.6-2-2-4Z" fill="#3AA0FF"/>` + alertBadge(48, 50);
  return r;
}

// ---------- Light sensor ----------
function lux(s, P) {
  const sky = {
    bright: [[[0, '#A6E1FF'], [1, '#3A98E8']], '#5BB0F0'],
    dim: [[[0, '#FFC78A'], [.6, '#F08A6B'], [1, '#7E5BD6']], '#E98A6E'],
    dark: [[[0, '#34477E'], [1, '#0E1530']], '#1D2A52'],
  }[s];
  let r = `<circle cx="32" cy="32" r="27" fill="${P.lg('sky', sky[0], sky[1])}" stroke="${LINE}"/>`;
  if (s === 'bright') {
    r += P.halo('halo', '#FFE27A', 32, 32, 20, .9);
    const rays = Array.from({ length: 8 }, (_, i) => { const t = i * Math.PI / 4; return `<path d="M${(32 + 12.5 * Math.cos(t)).toFixed(2)} ${(32 + 12.5 * Math.sin(t)).toFixed(2)}L${(32 + 17.5 * Math.cos(t)).toFixed(2)} ${(32 + 17.5 * Math.sin(t)).toFixed(2)}"/>`; }).join('');
    r += `<g class="hm-spin-slow" ${o(32, 32)} stroke="#FFE27A" stroke-width="2.8" stroke-linecap="round">${rays}</g>`;
    r += `<circle cx="32" cy="32" r="8.5" fill="${P.rg('sun', [[0, '#FFF6C8'], [1, '#FFC21F']], '#FFD23F', .4, .4, .7)}"/>`;
  } else if (s === 'dim') {
    r += P.halo('halo', '#FFD27A', 32, 40, 18, .8);
    r += `<path d="M21 40a11 11 0 0 1 22 0Z" fill="${P.lg('sun', [[0, '#FFE58A'], [1, '#FF9A3D']], '#FFB547')}"/>`;
    r += `<path d="M9 40.5h46" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`;
    r += `<path d="M14 46h36M19 51h26" stroke="#fff" stroke-opacity=".35" stroke-width="1.6" stroke-linecap="round"/>`;
  } else {
    r += `<path d="M37 18a12 12 0 1 0 8.5 19.5A10 10 0 0 1 37 18Z" fill="${P.lg('moon', [[0, '#FFF6D6'], [1, '#E6D59A']], '#F2E4B0')}"/>`;
    for (const [x, y, rr, d] of [[20, 20, 1.3, 0], [24, 44, 1, -.7], [46, 46, 1.2, -1.4], [17, 33, .9, -1.9]])
      r += `<circle cx="${x}" cy="${y}" r="${rr}" fill="#fff" class="hm-twinkle" style="animation-delay:${d}s"/>`;
  }
  return r;
}

// ---------- Motion sensor ----------
function motion(s, P) {
  const on = s === 'detected';
  const dome = on ? P.rg('dome', [[0, '#FFFFFF'], [.6, '#D9CCFF'], [1, '#9B7BFF']], '#C4B0FF', .4, .35, .75)
    : P.rg('dome', [[0, '#FFFFFF'], [1, '#C9D0DA']], '#E3E7ED', .4, .35, .75);
  let r = '';
  if (on) {
    r += P.halo('halo', '#9B6BFF', 32, 32, 32, .45);
    for (const d of [0, -1, -2]) r += `<circle cx="32" cy="32" r="21" fill="none" stroke="#8B5CF6" stroke-width="2" class="hm-ping" style="transform-origin:32px 32px;animation-delay:${d}s"/>`;
  }
  r += `<circle cx="32" cy="34.5" r="20" fill="#AEB7C3"/>`;
  r += `<circle cx="32" cy="32" r="20" fill="${whiteBody(P)}" stroke="${LINE}"/>`;
  r += `<circle cx="32" cy="30" r="11.5" fill="${dome}" stroke="${LINE}"/>`;
  r += `<g fill="none" stroke="${on ? '#7A55E8' : '#9AA3AF'}" stroke-opacity=".35" stroke-width="1"><path d="M20.5 30h23M32 18.5v23"/><circle cx="32" cy="30" r="6"/></g>`;
  r += P.hi(`<ellipse cx="28" cy="24.5" rx="4" ry="2.2" fill="#fff" opacity=".8" transform="rotate(-25 28 24.5)"/>`);
  r += `<circle cx="32" cy="46" r="1.6" fill="${on ? '#FF4B6E' : '#B4BCC7'}"/>`;
  return r;
}

// ---------- Temperature sensor ----------
function temp(s, P) {
  const cfg = {
    hot: [[[0, '#FF9A5B'], [1, '#E5302E']], '#F2492F', 13, '#FF5A3A'],
    comfortable: [[[0, '#8BEAB4'], [1, '#22B46A']], '#2FBF77', 24, null],
    cold: [[[0, '#A5ECFF'], [1, '#3A7DFF']], '#3A8DFF', 34, '#3AA0FF'],
  }[s];
  const fill = P.lg('merc', cfg[0], cfg[1]);
  const glass = P.lg('glass', [[0, '#FFFFFF'], [1, '#DDE2E9']], '#F1F3F6', 0, 0, 1, 0);
  let r = '';
  if (cfg[3]) r += P.halo('halo', cfg[3], 32, 40, 28, .45);
  r += `<path d="M27 13a5 5 0 0 1 10 0v26.5a10 10 0 1 1-10 0Z" fill="${glass}" stroke="${LINE}" stroke-width="1.2"/>`;
  r += `<g stroke="#9AA3AF" stroke-width="1.4" stroke-linecap="round"><path d="M40 15h4M40 21h3M40 27h4M40 33h3"/></g>`;
  r += `<g${s === 'hot' ? ` class="hm-rise" ${o(32, 48)}` : ''}><rect x="30" y="${cfg[2]}" width="4" height="${44 - cfg[2]}" rx="2" fill="${fill}"/></g>`;
  r += `<circle cx="32" cy="48" r="6.8" fill="${fill}"/>`;
  r += P.hi(`<path d="M28.6 13.5v22" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><circle cx="29.6" cy="45.6" r="1.8" fill="#fff" opacity=".55"/>`);
  if (s === 'hot') r += `<g fill="none" stroke="#FF6A3D" stroke-width="1.8" stroke-linecap="round" class="hm-breathe"><path d="M18 22c-1.5-1.6 1.5-3 0-4.8M18 32c-1.5-1.6 1.5-3 0-4.8"/></g>`;
  if (s === 'cold') r += `<g class="hm-spin-slow" ${o(18, 22)}>${flake(18, 22, 5, '#3AA0FF', 1.8)}</g>`;
  return r;
}

// ---------- Dishwasher ----------
function dishwasher(s, P) {
  const run = s === 'running', on = s !== 'off';
  const win = on ? P.lg('win', [[0, '#D9F1FF'], [1, '#8CC8F0']], '#B5DDF7') : P.lg('win', [[0, '#EEF1F5'], [1, '#C3CBD5']], '#D6DCE3');
  const led = run ? '#36C8FF' : on ? '#22D877' : '#A3ACB8';
  let r = '';
  if (run) r += P.halo('halo', '#3AB0FF', 32, 32, 31, .4);
  r += `<rect x="11" y="9.5" width="42" height="50" rx="7" fill="#AEB7C3"/>`;
  r += `<rect x="11" y="7" width="42" height="50" rx="7" fill="${whiteBody(P)}" stroke="${LINE}"/>`;
  r += `<rect x="11" y="7" width="42" height="9" rx="7" fill="${P.lg('strip', [[0, '#5A6372'], [1, '#353C47']], '#454D59')}"/><rect x="11" y="12" width="42" height="4" fill="${P.soft ? 'url(#' + P.defs[P.defs.length - 1].match(/id="([^"]+)"/)[1] + ')' : '#454D59'}"/>`;
  r += `<rect x="34" y="9.6" width="13" height="4" rx="1.4" fill="#151A21"/><rect x="35.5" y="11" width="${run ? 7 : on ? 10 : 3}" height="1.4" rx=".7" fill="${led}"/>`;
  r += `<g fill="${on ? '#9AA3AF' : '#7D8794'}"><circle cx="17" cy="11.6" r="1.2"/><circle cx="21" cy="11.6" r="1.2"/><circle cx="25" cy="11.6" r="1.2"/></g>`;
  r += `<rect x="20" y="20" width="24" height="3" rx="1.5" fill="${metalH(P)}"/>`;
  r += `<rect x="15.5" y="27" width="33" height="24" rx="4" fill="${win}" stroke="${LINE}"/>`;
  const plate = (x, c) => `<rect x="${x}" y="31.5" width="3.2" height="15" rx="1.6" fill="${c}"/>`;
  r += `<g>${[[19, '#FFFFFF'], [23.5, '#FFFFFF'], [28, '#FFD9A8'], [32.5, '#FFFFFF'], [37, '#B9D8FF']].map(([x, c]) => plate(x, on ? c : '#E6EAEF')).join('')}<rect x="41.5" y="38" width="3.6" height="8.5" rx="1" fill="${on ? '#E6F4FF' : '#E6EAEF'}" stroke="${LINE}" stroke-width=".6"/></g>`;
  r += `<path d="M17 47.5h30" stroke="#8D96A2" stroke-width="1.2" stroke-linecap="round"/>`;
  if (run) {
    for (const [x, d] of [[21, 0], [26, -.4], [31, -.8], [36, -.2], [41, -.6], [46, -1]])
      r += `<path class="hm-spray" style="animation-delay:${d}s" d="M${x} 29.5v3" stroke="#2D8FE0" stroke-width="1.4" stroke-linecap="round"/>`;
    for (const [x, y, d] of [[22, 44, 0], [34, 42, -.7], [43, 45, -1.3]])
      r += `<circle class="hm-bubble" style="animation-delay:${d}s" cx="${x}" cy="${y}" r="1.4" fill="#fff" stroke="#7CC2F2" stroke-width=".6"/>`;
  }
  r += P.hi(`<path d="M18 29.5h12" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`);
  return r;
}

const DEVICES = [
  { key: 'light', name: 'Light', fn: light, states: ['on', 'dim', 'off'] },
  { key: 'lock', name: 'Lock', fn: lock, states: ['locked', 'unlocked', 'jammed'] },
  { key: 'door', name: 'Door', fn: door, states: ['closed', 'open'] },
  { key: 'blind', name: 'Blind', fn: blind, states: ['0','10','20','30','40','50','60','70','80','90','100','opening','closing'] },
  { key: 'thermostat', name: 'Thermostat', fn: thermostat, states: ['heat', 'cool', 'idle', 'off'] },
  { key: 'plug', name: 'Smart plug', fn: plug, states: ['on', 'off'] },
  { key: 'fan', name: 'Fan', fn: fan, states: ['on', 'off'] },
  { key: 'coffee', name: 'Coffee machine', fn: coffee, states: ['brewing', 'ready', 'off'] },
  { key: 'washer', name: 'Washing machine', fn: laundry('washer'), states: ['running', 'done', 'off'] },
  { key: 'dishwasher', name: 'Dishwasher', fn: dishwasher, states: ['running', 'on', 'off'] },
  { key: 'dryer', name: 'Dryer', fn: laundry('dryer'), states: ['running', 'done', 'off'] },
  { key: 'fridge', name: 'Fridge', fn: fridge, states: ['closed', 'open'] },
  { key: 'freezer', name: 'Chest freezer', fn: freezer, states: ['ok', 'open', 'warm'] },
  { key: 'lux', name: 'Light sensor', fn: lux, states: ['bright', 'dim', 'dark'] },
  { key: 'motion', name: 'Motion sensor', fn: motion, states: ['detected', 'clear'] },
  { key: 'temp', name: 'Temperature sensor', fn: temp, states: ['hot', 'comfortable', 'cold'] },
];

function build(mode, dev, state) {
  const pfx = `hm-${mode[0]}-${dev.key}-${state}`;
  const P = painter(mode, pfx);
  const body = dev.fn(state, P);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" role="img" aria-label="${dev.name} ${state}"><style>${CSS}</style>${P.defs.length ? `<defs>${P.defs.join('')}</defs>` : ''}${body}</svg>`;
}

// Inline form for the cards: no <style> (the card supplies CSS) and no fixed size.
function buildInline(mode, dev, state) {
  const P = painter(mode, `m${mode[0]}`);
  const body = dev.fn(state, P);
  return `<svg viewBox="0 0 64 64" aria-hidden="true">${P.defs.length ? `<defs>${P.defs.join("")}</defs>` : ""}${body}</svg>`;
}

module.exports = { DEVICES, build, buildInline, CSS };
