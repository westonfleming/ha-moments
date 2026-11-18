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
.hm-part{animation:hm-part 3s ease-in-out infinite}
@keyframes hm-part{0%,12%{transform:scaleX(1)}82%,100%{transform:scaleX(.22)}}
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

// ======================================================================
// Home Assistant coverage (Nov 2026): a set for every common domain and
// device class that had none. Same grammar as above: a light, slightly
// dimensional object; colour and a halo only while active; motion only
// while something is happening; badges bottom-right for status.
// ======================================================================

const SHADOW = '#AEB7C3';
const shadowed = (x, y, w, h, rx, fill) =>
  `<rect x="${x}" y="${y + 2.5}" width="${w}" height="${h}" rx="${rx}" fill="${SHADOW}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${LINE}"/>`;
const badge = (cx, cy, c, inner) => `<circle cx="${cx}" cy="${cy}" r="7.5" fill="${c}" stroke="#fff" stroke-width="2"/>${inner}`;
const boltBadge = (P, cx, cy) => {
  const f = P.lg('boltb', [[0, '#FFE77F'], [1, '#FFAE1A']], '#FFC233');
  return `<circle cx="${cx}" cy="${cy}" r="7.5" fill="${f}" stroke="#fff" stroke-width="2"/><path d="M${cx + .9} ${cy - 4.7} ${cx - 3.4} ${cy + 1}h3.4l-.9 3.7 4.3-5.7H${cx}Z" fill="#7A4A00"/>`;
};
const pauseBadge = (cx, cy) => badge(cx, cy, '#F59E0B', `<g fill="#fff"><rect x="${cx - 3}" y="${cy - 3.4}" width="2.2" height="6.8" rx="1"/><rect x="${cx + .8}" y="${cy - 3.4}" width="2.2" height="6.8" rx="1"/></g>`);
const homeBadge = (cx, cy, c = '#3A8DFF') => badge(cx, cy, c, `<path d="M${cx - 3.6} ${cy + .2} ${cx} ${cy - 3.4} ${cx + 3.6} ${cy + .2}M${cx - 2.4} ${cy - .6}v4h4.8v-4" fill="none" stroke="#fff" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>`);
const slashBadge = (cx, cy) => badge(cx, cy, '#EF4438', `<path d="M${cx - 3} ${cy - 3} ${cx + 3} ${cy + 3}M${cx + 3} ${cy - 3} ${cx - 3} ${cy + 3}" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`);
const ledDot = (cx, cy, c, cls = '') => `<circle cx="${cx}" cy="${cy}" r="1.8" fill="${c}"${cls ? ` class="${cls}"` : ''}/>`;
const skyPane = (P, x, y, w, h) => {
  const sky = P.lg('sky', [[0, '#8FD8FF'], [1, '#3A98E8']], '#56AEF0');
  return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="2" fill="${sky}"/>` + P.halo('sun', '#FFE27A', x + w - 10, y + 10, 10, .85, '') + `<circle cx="${x + w - 10}" cy="${y + 10}" r="4.4" fill="#FFD447"/>` +
    `<g fill="#fff" opacity=".95"><circle cx="${x + 7}" cy="${y + h - 9}" r="3"/><circle cx="${x + 11.5}" cy="${y + h - 11.5}" r="3.9"/><circle cx="${x + 15.5}" cy="${y + h - 8.6}" r="2.6"/><rect x="${x + 7}" y="${y + h - 9}" width="8.5" height="3"/></g>`;
};

// ---------- Window ----------
function windowIcon(s, P) {
  const open = s === 'open';
  const frame = P.lg('frame', [[0, '#F6F8FA'], [1, '#C5CCD6']], '#D9DEE5');
  let r = '';
  if (open) r += P.halo('halo', '#FFC24D', 32, 32, 31, .35);
  r += `<rect x="10" y="7" width="44" height="47" rx="4" fill="${frame}" stroke="${LINE}"/>`;
  r += skyPane(P, 14, 11, 36, 39);
  r += `<rect x="31.25" y="11" width="1.5" height="39" fill="${frame}"/>`;
  r += P.hi(`<path d="M17 31 23 21M17 38l11-17" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>`);
  if (!open) {
    r += P.hi(`<path d="M35 47 41 37M35 42l7-10" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".45"/>`);
    r += `<rect x="34.5" y="28" width="2" height="7" rx="1" fill="${metalH(P)}"/>`;
  } else {
    // right sash swung out on its hinge
    r += `<g class="hm-swing" ${o(50, 30)}><path d="M50 11 41 14.5v32L50 50Z" fill="${frame}" stroke="${LINE}"/><path d="M48.5 14 43 16.2v28.3l5.5 2.6Z" fill="#BFE6FF" opacity=".85"/><rect x="43.6" y="28" width="1.6" height="6" rx=".8" fill="#8D96A2"/></g>`;
    r += `<g fill="none" stroke="#fff" stroke-width="1.6" stroke-linecap="round" class="hm-breathe" opacity=".9"><path d="M34 22c2-1.5 4 1.5 6 0"/><path d="M34.5 29c2-1.5 4 1.5 6 0"/><path d="M34 36c2-1.5 4 1.5 6 0"/></g>`;
  }
  r += `<rect x="7" y="53" width="50" height="5" rx="2" fill="${P.lg('sill', [[0, '#E9EDF1'], [1, '#B4BCC7']], '#C9D0D9')}" stroke="${LINE}"/>`;
  return r;
}

// ---------- Garage door ----------
function garage(s, P) {
  const anim = s === 'opening' || s === 'closing';
  const open = s === 'open';
  const wall = P.lg('wall', [[0, '#F6F8FA'], [1, '#C5CCD6']], '#D9DEE5');
  const panel = P.lg('panel', [[0, '#E7ECF2'], [1, '#AEB8C5']], '#C6CED8');
  let r = '';
  if (open || anim) r += P.halo('halo', '#FFC24D', 32, 44, 28, .4);
  r += `<path d="M7 25 32 8l25 17v32H7Z" fill="${wall}" stroke="${LINE}" stroke-linejoin="round"/>`;
  r += P.hi(`<path d="M10 24.5 32 10l22 14.5" fill="none" stroke="#fff" stroke-width="1.6" opacity=".7"/>`);
  const inside = open || anim ? P.lg('inside', [[0, '#FFE8B0'], [1, '#F2A43A']], '#FFC95A') : '#3A414D';
  r += `<rect x="13" y="27" width="38" height="30" fill="${inside}"/>`;
  if (open || anim) {
    // car, seen from the front
    r += `<path d="M20 50v-6.5l3.4-6.5h17.2l3.4 6.5V50Z" fill="#3F66E0"/><path d="M24.6 38.4h14.8l2.4 4.6H22.2Z" fill="#BFE6FF"/><g fill="#FFF3C4"><circle cx="24" cy="46.5" r="1.8"/><circle cx="40" cy="46.5" r="1.8"/></g><g fill="#1D232E"><rect x="20" y="50" width="5" height="4" rx="1.2"/><rect x="39" y="50" width="5" height="4" rx="1.2"/></g>`;
  }
  const slats = Array.from({ length: 5 }, (_, i) => `<path d="M13 ${33 + i * 6}h38"/>`).join('');
  const door = `<rect x="13" y="27" width="38" height="30" fill="${panel}"/><g stroke="#6F7B8C" stroke-opacity=".35" stroke-width="1.2">${slats}</g><rect x="29" y="52" width="6" height="1.8" rx=".9" fill="#6F7B8C"/>`;
  const dir = s === 'closing' ? 'animation-direction:reverse;' : '';
  if (anim) r += `<g class="hm-roll" style="${dir}transform-origin:32px 27px">${door}</g>`;
  else if (open) r += `<g style="transform:scaleY(.12);transform-origin:32px 27px">${door}</g>`;
  else r += door;
  r += `<rect x="12" y="25.5" width="40" height="3" rx="1.5" fill="#6F7B8C"/>`;
  return r;
}

// ---------- Gate ----------
function gate(s, P) {
  const anim = s === 'opening' || s === 'closing';
  const open = s === 'open';
  const post = P.lg('post', [[0, '#8D96A2'], [1, '#596270']], '#6F7884', 0, 0, 1, 0);
  const bar = open || anim ? '#F2A33A' : '#4A515D';
  const leaf = (x0, w, flip) => {
    const bars = Array.from({ length: 4 }, (_, i) => `<rect x="${(x0 + 2 + i * (w - 4) / 3.4).toFixed(1)}" y="${flip ? 22 : 22}" width="2" height="30" rx="1"/>`).join('');
    return `<g fill="${bar}">${bars}<rect x="${x0}" y="24" width="${w}" height="2.4" rx="1.2"/><rect x="${x0}" y="45" width="${w}" height="2.4" rx="1.2"/></g>`;
  };
  let r = '';
  if (open || anim) r += P.halo('halo', '#FFC24D', 32, 40, 28, .35);
  r += `<path d="M4 54h56" stroke="#8D96A2" stroke-width="2" stroke-linecap="round"/>`;
  r += P.hi(`<ellipse cx="32" cy="55" rx="22" ry="2" fill="#000" opacity=".08"/>`);
  const dir = s === 'closing' ? 'animation-direction:reverse;' : '';
  const L = leaf(11.5, 20, false), R = leaf(32.5, 20, true);
  if (anim) r += `<g class="hm-part" style="${dir}transform-origin:11.5px 0">${L}</g><g class="hm-part" style="${dir}transform-origin:52.5px 0">${R}</g>`;
  else if (open) r += `<g style="transform:scaleX(.22);transform-origin:11.5px 0">${L}</g><g style="transform:scaleX(.22);transform-origin:52.5px 0">${R}</g>`;
  else r += L + R + `<rect x="30.6" y="33" width="2.8" height="5" rx="1" fill="#F5B524"/>`;
  r += `<rect x="6" y="17" width="5.5" height="38" rx="1.6" fill="${post}"/><rect x="52.5" y="17" width="5.5" height="38" rx="1.6" fill="${post}"/>`;
  r += `<g fill="#AEB7C3"><rect x="5" y="15" width="7.5" height="3" rx="1.5"/><rect x="51.5" y="15" width="7.5" height="3" rx="1.5"/></g>`;
  return r;
}

// ---------- Curtains ----------
function curtain(s, P) {
  const anim = s === 'opening' || s === 'closing';
  const k = { closed: 1, partial: .55, open: .22 }[s] ?? 1;
  const fabric = P.lg('fabric', [[0, '#C9B8F2'], [1, '#8D77D8']], '#A592E4', 0, 0, 1, 0);
  const frame = P.lg('frame', [[0, '#F6F8FA'], [1, '#C5CCD6']], '#D9DEE5');
  let r = '';
  if (s !== 'closed') r += P.halo('halo', '#FFE27A', 32, 30, 28, .3, '');
  r += `<rect x="12" y="11" width="40" height="44" rx="3" fill="${frame}" stroke="${LINE}"/>`;
  r += skyPane(P, 15, 14, 34, 38);
  const panel = (x, w) => {
    const pleats = Array.from({ length: 4 }, (_, i) => `<path d="M${(x + (i + .8) * w / 4.6).toFixed(1)} 12v45"/>`).join('');
    return `<path d="M${x} 10h${w}v46c-${(w / 2).toFixed(1)} 2-${w} 0-${w} 0Z" fill="${fabric}"/><g stroke="#3F2E86" stroke-opacity=".18" stroke-width="1.4">${pleats}</g>`;
  };
  const dir = s === 'closing' ? 'animation-direction:reverse;' : '';
  const L = panel(9, 23), R = panel(32, 23);
  if (anim) r += `<g class="hm-part" style="${dir}transform-origin:9px 0">${L}</g><g class="hm-part" style="${dir}transform-origin:55px 0">${R}</g>`;
  else r += `<g style="transform:scaleX(${k});transform-origin:9px 0">${L}</g><g style="transform:scaleX(${k});transform-origin:55px 0">${R}</g>`;
  r += `<rect x="6" y="7" width="52" height="4" rx="2" fill="${P.lg('rod', [[0, '#707A89'], [1, '#434B57']], '#525B68')}"/><g fill="#434B57"><circle cx="6.5" cy="9" r="2.6"/><circle cx="57.5" cy="9" r="2.6"/></g>`;
  return r;
}

// ---------- TV ----------
function tv(s, P) {
  const on = s !== 'off';
  const bezel = P.lg('bezel', [[0, '#3A4252'], [1, '#161A21']], '#262C36');
  const screen = s === 'playing' ? P.lg('screen', [[0, '#7C5CFF'], [.55, '#3A8DFF'], [1, '#22C1C3']], '#5B74F5', 0, 0, 1, 1)
    : s === 'paused' ? P.lg('screen', [[0, '#5C5096'], [1, '#2C4A82']], '#45508C', 0, 0, 1, 1)
    : s === 'on' ? P.lg('screen', [[0, '#2B3A66'], [1, '#18213C']], '#232F52', 0, 0, 1, 1)
    : P.lg('screen', [[0, '#1F242D'], [1, '#0C0F14']], '#151920', 0, 0, 1, 1);
  let r = '';
  if (s === 'playing') r += P.halo('halo', '#6E7BFF', 32, 28, 32, .5);
  r += `<path d="M26 47h12l3 8H23Z" fill="${P.lg('stand', [[0, '#8D96A2'], [1, '#596270']], '#6F7884')}"/><rect x="18" y="54" width="28" height="3" rx="1.5" fill="#596270"/>`;
  r += `<rect x="6" y="10" width="52" height="37" rx="5" fill="${bezel}"/>`;
  r += `<rect x="9" y="13" width="46" height="31" rx="2.5" fill="${screen}"/>`;
  if (s === 'playing') {
    r += `<g class="hm-breathe"><circle cx="20" cy="22" r="7" fill="#fff" opacity=".14"/><circle cx="46" cy="36" r="9" fill="#fff" opacity=".1"/></g>`;
    r += `<path d="M28.5 21.5v13l11-6.5Z" fill="#fff"/>`;
    r += `<rect x="13" y="39.5" width="38" height="1.6" rx=".8" fill="#fff" opacity=".35"/><rect x="13" y="39.5" width="22" height="1.6" rx=".8" fill="#fff"/>`;
  } else if (s === 'paused') {
    r += `<g fill="#fff" opacity=".95"><rect x="26.5" y="21" width="4" height="13" rx="1.6"/><rect x="33.5" y="21" width="4" height="13" rx="1.6"/></g>`;
    r += `<rect x="13" y="39.5" width="38" height="1.6" rx=".8" fill="#fff" opacity=".3"/><rect x="13" y="39.5" width="22" height="1.6" rx=".8" fill="#fff" opacity=".7"/>`;
  } else if (s === 'on') {
    r += `<g fill="#fff" opacity=".55"><rect x="15" y="31" width="9" height="7" rx="1.5"/><rect x="27.5" y="31" width="9" height="7" rx="1.5"/><rect x="40" y="31" width="9" height="7" rx="1.5"/></g><rect x="15" y="19" width="18" height="3" rx="1.5" fill="#fff" opacity=".7"/>`;
  }
  r += P.hi(`<path d="M11 15h16l-9 27h-7Z" fill="#fff" opacity="${on ? .06 : .09}"/>`);
  r += ledDot(32, 45.6, on ? '#22D877' : '#E5484D');
  return r;
}

// ---------- Speaker ----------
function speaker(s, P) {
  const play = s === 'playing';
  const body = P.lg('body', [[0, '#4A5364'], [1, '#1E232C']], '#323A47');
  const cone = P.rg('cone', [[0, '#5A6475'], [.7, '#262C36'], [1, '#14181E']], '#2A313C', .45, .4, .6);
  let r = '';
  if (play) {
    r += P.halo('halo', '#B07CFF', 32, 36, 31, .4);
    for (const d of [0, -1.2]) r += `<g class="hm-ping" style="transform-origin:32px 38px;animation-delay:${d}s" fill="none" stroke="#9B6BFF" stroke-width="2" stroke-linecap="round"><path d="M10 26a26 26 0 0 0 0 24"/><path d="M54 26a26 26 0 0 1 0 24"/></g>`;
  }
  r += `<rect x="17" y="8.5" width="30" height="50" rx="8" fill="${SHADOW}"/>`;
  r += `<rect x="17" y="6" width="30" height="50" rx="8" fill="${body}"/>`;
  r += P.hi(`<rect x="20" y="8" width="24" height="3" rx="1.5" fill="#fff" opacity=".12"/>`);
  r += `<circle cx="32" cy="17.5" r="4" fill="${cone}" stroke="#596270" stroke-width="1"/>`;
  r += `<g${play ? ` class="hm-rays" ${o(32, 38)}` : ''}><circle cx="32" cy="38" r="11" fill="${cone}" stroke="#596270" stroke-width="1.2"/><circle cx="32" cy="38" r="3.6" fill="${play ? '#9B6BFF' : '#596270'}"/></g>`;
  const led = play ? '#B07CFF' : s === 'paused' ? '#F59E0B' : s === 'on' ? '#22D877' : '#596270';
  r += `<rect x="26" y="51" width="12" height="2" rx="1" fill="${led}"/>`;
  if (s === 'paused') r += pauseBadge(47, 49);
  return r;
}

// ---------- Robot vacuum (top view) ----------
function vacuum(s, P) {
  const run = s === 'cleaning', home = s === 'returning';
  const shell = P.rg('shell', [[0, '#FFFFFF'], [.75, '#E3E8EE'], [1, '#B9C2CD']], '#EEF1F5', .4, .35, .75);
  let r = '';
  if (run) {
    r += P.halo('halo', '#2CD3C0', 32, 32, 31, .4);
    r += `<path d="M6 52c8-2 6-10 14-12" fill="none" stroke="#20B2AC" stroke-width="2" stroke-linecap="round" stroke-dasharray="2 3.2" class="hm-flow" opacity=".7"/>`;
  }
  if (s === 'docked') r += `<path d="M14 6h36v8a4 4 0 0 1-4 4H18a4 4 0 0 1-4-4Z" fill="#596270"/><rect x="28" y="14" width="8" height="3" rx="1" fill="#22D877"/>`;
  r += `<g${s === 'error' ? ' class="hm-shake"' : ''}>`;
  r += `<circle cx="32" cy="36.5" r="21" fill="${SHADOW}"/>`;
  r += `<circle cx="32" cy="34" r="21" fill="${shell}" stroke="${LINE}"/>`;
  r += `<path d="M14.5 25a21 21 0 0 1 35 0" fill="none" stroke="#596270" stroke-width="3" stroke-linecap="round" opacity=".55"/>`;
  r += `<circle cx="32" cy="27" r="5.5" fill="${P.lg('lidar', [[0, '#4A5364'], [1, '#1E232C']], '#323A47')}"/>`;
  r += P.hi(`<ellipse cx="30.5" cy="25.5" rx="2" ry="1.1" fill="#fff" opacity=".35"/>`);
  r += `<rect x="24" y="38" width="16" height="3" rx="1.5" fill="#C9D0D9"/>`;
  r += `<circle cx="32" cy="46" r="1.8" fill="${run ? '#20B2AC' : home ? '#3A8DFF' : s === 'docked' ? '#22D877' : s === 'error' ? '#EF4438' : '#A3ACB8'}"/>`;
  // side brush
  const brush = `<g stroke="#8D96A2" stroke-width="1.3" stroke-linecap="round"><path d="M17 44l-5-1M17 44l1.5-5M17 44l3.5 3.6"/></g><circle cx="17" cy="44" r="1.6" fill="#596270"/>`;
  r += run ? `<g class="hm-spin" ${o(17, 44)}>${brush}</g>` : brush;
  r += `</g>`;
  if (home) r += homeBadge(48, 50);
  if (s === 'docked') r += boltBadge(P, 48, 50);
  if (s === 'paused') r += pauseBadge(48, 50);
  if (s === 'error') r += alertBadge(48, 50);
  return r;
}

// ---------- Robot lawn mower (side view) ----------
function mower(s, P) {
  const run = s === 'mowing';
  const shell = run ? P.lg('shell', [[0, '#8BEAB4'], [1, '#1E9C5A']], '#2FBF77') : P.lg('shell', [[0, '#E9EDF1'], [1, '#AEB7C3']], '#C9D0D9');
  let r = '';
  if (run) r += P.halo('halo', '#2EDB86', 32, 38, 30, .35);
  if (s === 'docked') r += `<path d="M44 52V28h9a3 3 0 0 1 3 3v21Z" fill="#596270"/><rect x="45" y="31" width="7" height="2.4" rx="1.2" fill="#22D877"/>`;
  r += `<g${s === 'error' ? ' class="hm-shake"' : ''}>`;
  r += `<path d="M9 44c0-7 7-15 19-15h6c9 0 15 6 17 15Z" fill="${shell}" stroke="${LINE}"/>`;
  r += P.hi(`<path d="M15 39c2-4.5 7-7.6 13-7.6" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>`);
  r += `<rect x="30" y="31" width="9" height="4" rx="2" fill="#1D232E"/><circle cx="36.5" cy="33" r="1" fill="${run ? '#22D877' : s === 'error' ? '#EF4438' : s === 'returning' ? '#3A8DFF' : '#8D96A2'}"/>`;
  r += `<rect x="9" y="43" width="42" height="4" rx="2" fill="#4A515D"/>`;
  const wheel = (cx, rr) => {
    const w = `<circle cx="${cx}" cy="48" r="${rr}" fill="#2A313C"/><circle cx="${cx}" cy="48" r="${rr * .45}" fill="#8D96A2"/><path d="M${cx - rr * .45} 48h${rr * .9}" stroke="#2A313C" stroke-width="1"/>`;
    return run || s === 'returning' ? `<g class="hm-spin" ${o(cx, 48)}>${w}</g>` : w;
  };
  r += wheel(17, 6) + wheel(43, 4.5);
  r += `</g>`;
  r += `<path d="M4 55h56" stroke="#2FBF77" stroke-width="2" stroke-linecap="round"/>`;
  r += `<g stroke="#2FBF77" stroke-width="1.6" stroke-linecap="round"><path d="M6 55l-1-4M8 55l1.5-4.5M54 55l-1-4M57 55l1.5-4"/></g>`;
  if (run) for (const [x, d] of [[26, 0], [30, -.3], [34, -.6]]) r += `<path class="hm-bubble" style="animation-delay:${d}s" d="M${x} 52l1-2.4" stroke="#7FE0A6" stroke-width="1.4" stroke-linecap="round"/>`;
  if (s === 'returning') r += homeBadge(50, 14);
  if (s === 'docked') r += boltBadge(P, 50, 14);
  if (s === 'paused') r += pauseBadge(50, 14);
  if (s === 'error') r += alertBadge(50, 14);
  return r;
}

// ---------- Humidifier / dehumidifier ----------
function humidifier(s, P) {
  const hum = s === 'humidifying', dry = s === 'drying', on = s !== 'off';
  const water = P.lg('water', [[0, '#9EDCFF'], [1, '#2D8FE0']], '#56AEF0');
  let r = '';
  if (hum) r += P.halo('halo', '#5CC4FF', 32, 26, 30, .45);
  if (dry) r += P.halo('halo', '#FFB25B', 32, 40, 30, .35);
  r += shadowed(15, 12, 34, 45, 9, whiteBody(P));
  r += `<ellipse cx="32" cy="13.5" rx="9" ry="2.6" fill="${on ? '#C9D0D9' : '#D6DCE4'}" stroke="${LINE}"/>`;
  // tank window
  r += `<rect x="20" y="28" width="24" height="22" rx="4" fill="#E9F4FC" stroke="${LINE}"/>`;
  r += `<rect x="20.5" y="${dry ? 41 : 35}" width="23" height="${dry ? 8.5 : 14.5}" rx="3.5" fill="${on ? water : '#C9D0D9'}"/>`;
  r += P.hi(`<path d="M23 31v15" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".7"/>`);
  r += `<circle cx="32" cy="21" r="2.6" fill="${hum ? '#2D8FE0' : dry ? '#F08A2E' : s === 'idle' ? '#22D877' : '#A3ACB8'}"/>`;
  if (hum) r += `<g fill="none" stroke="#7CC8F5" stroke-width="2" stroke-linecap="round"><path class="hm-steam" d="M27 9c-2-2 2-3.6 0-6"/><path class="hm-steam" style="animation-delay:-.6s" d="M32 9c-2-2 2-3.6 0-6"/><path class="hm-steam" style="animation-delay:-1.2s" d="M37 9c-2-2 2-3.6 0-6"/></g>`;
  if (dry) r += `<path class="hm-drip2" d="M32 25.5c-1.6 2.3-2.4 3.4-2.4 4.6a2.4 2.4 0 0 0 4.8 0c0-1.2-.8-2.3-2.4-4.6Z" fill="#2D8FE0"/>`;
  return r;
}

// ---------- Water heater ----------
function waterHeater(s, P) {
  const heat = s === 'heating';
  const tank = P.lg('tank', [[0, '#C9D0D9'], [.35, '#FFFFFF'], [1, '#B4BCC7']], '#E3E8EE', 0, 0, 1, 0);
  let r = '';
  if (heat) r += P.halo('halo', '#FF7A35', 32, 44, 30, .45);
  r += `<rect x="17" y="8.5" width="30" height="45" rx="12" fill="${SHADOW}"/>`;
  r += `<rect x="17" y="6" width="30" height="45" rx="12" fill="${tank}" stroke="${LINE}"/>`;
  r += `<g fill="#8D96A2"><rect x="22" y="2" width="4" height="6" rx="1"/><rect x="38" y="2" width="4" height="6" rx="1"/></g>`;
  r += `<path d="M24 3h0" stroke="#3A8DFF"/><rect x="22" y="2" width="4" height="2" rx="1" fill="#3A8DFF"/><rect x="38" y="2" width="4" height="2" rx="1" fill="#EF4438"/>`;
  // gauge
  r += `<circle cx="32" cy="22" r="7" fill="#1D232E"/><path d="M27.5 24.5a5 5 0 0 1 9 0" fill="none" stroke="#3A414D" stroke-width="1.6"/>`;
  const needle = heat ? 'M32 22l3.6-3' : s === 'eco' ? 'M32 22l.2-4.6' : 'M32 22l-3.6-2.4';
  r += `<path d="${needle}" stroke="${heat ? '#FF6237' : s === 'eco' ? '#2DBE76' : '#8D96A2'}" stroke-width="1.8" stroke-linecap="round"/><circle cx="32" cy="22" r="1.4" fill="#fff"/>`;
  // burner window
  r += `<rect x="25" y="38" width="14" height="8" rx="3" fill="#1D232E"/>`;
  if (heat) {
    const fl = P.lg('flame', [[0, '#FFD66E'], [.55, '#FF7A2E'], [1, '#EE3F2A']], '#FF6A2E');
    r += `<g class="hm-flicker" ${o(32, 45)}><path d="M28 45.5c0-3 2-3.6 2-6 1.4 1 2 2.4 2 3.4.6-1 1.2-2 1-3.4 2 1.4 3 3.4 3 6Z" fill="${fl}"/></g>`;
  } else if (s === 'eco') {
    const lf = P.lg('leaf', [[0, '#A8F2C8'], [1, '#2DBE76']], '#3DCB85', 0, 1, 1, 0);
    r += `<path d="M28 45c0-4 2.5-6 8-6 0 4.4-2.6 6-8 6Z" fill="${lf}"/>`;
  }
  r += `<rect x="19" y="51" width="26" height="4" rx="2" fill="#8D96A2"/>`;
  return r;
}

// ---------- Valve ----------
function valve(s, P) {
  const anim = s === 'opening' || s === 'closing';
  const open = s === 'open';
  const pipe = P.lg('pipe', [[0, '#E3E8EE'], [.5, '#B4BCC7'], [1, '#7D8794']], '#A9B2BE');
  const wheelC = open ? '#2D8FE0' : anim ? '#F59E0B' : '#EF4438';
  let r = '';
  if (open) r += P.halo('halo', '#3AB0FF', 32, 42, 30, .35);
  r += `<rect x="4" y="36" width="56" height="13" rx="3" fill="${pipe}" stroke="${LINE}"/>`;
  r += `<g fill="#8D96A2"><rect x="10" y="33" width="5" height="19" rx="1.5"/><rect x="49" y="33" width="5" height="19" rx="1.5"/></g>`;
  if (open || anim) r += `<path d="M5 42.5h54" stroke="#3AA0FF" stroke-width="4" stroke-linecap="round" stroke-dasharray="6.4 5" class="hm-flow" opacity="${open ? .9 : .5}"/>`;
  r += `<path d="M24 34h16l-2 -4h-12Z" fill="#7D8794"/><rect x="22" y="33" width="20" height="19" rx="4" fill="${P.lg('body', [[0, '#C9D0D9'], [1, '#7D8794']], '#9AA3AF')}" stroke="${LINE}"/>`;
  r += `<rect x="30.5" y="16" width="3" height="15" fill="#596270"/>`;
  const wheel = `<circle cx="32" cy="15.5" r="10" fill="none" stroke="${wheelC}" stroke-width="3.2"/><g stroke="${wheelC}" stroke-width="2.2" stroke-linecap="round"><path d="M22.5 15.5h19M32 6v19M25.3 8.8l13.4 13.4M38.7 8.8 25.3 22.2"/></g><circle cx="32" cy="15.5" r="3" fill="${wheelC}"/>`;
  r += anim ? `<g class="hm-spin-slow" style="animation-duration:3s;${s === 'closing' ? 'animation-direction:reverse;' : ''}transform-origin:32px 15.5px">${wheel}</g>` : wheel;
  r += P.hi(`<path d="M24 36v12" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>`);
  return r;
}

// ---------- Alarm panel ----------
function alarm(s, P) {
  const cfg = {
    disarmed: [[[0, '#E9EDF1'], [1, '#AEB7C3']], '#C9D0D9', null],
    armed_home: [[[0, '#7BEDB2'], [.55, '#22B46A'], [1, '#128a4e']], '#22B46A', '#2EDB86'],
    armed_away: [[[0, '#9CC8FF'], [.55, '#3A8DFF'], [1, '#2357C9']], '#3A8DFF', '#3AA0FF'],
    armed_night: [[[0, '#B4A6FF'], [.55, '#6D5BD6'], [1, '#43349E']], '#6D5BD6', '#8B7BFF'],
    arming: [[[0, '#FFDC80'], [.55, '#F7A51C'], [1, '#D07A08']], '#F7A51C', '#FFB020'],
    pending: [[[0, '#FFDC80'], [.55, '#F7A51C'], [1, '#D07A08']], '#F7A51C', '#FFB020'],
    triggered: [[[0, '#FFA293'], [.55, '#EF4438'], [1, '#BF241A']], '#EF4438', '#FF4B3A'],
  }[s];
  const fill = P.lg('shield', cfg[0], cfg[1]);
  const shield = 'M32 6 51 13v15c0 13-8 22-19 27-11-5-19-14-19-27V13Z';
  let r = '';
  if (cfg[2]) r += P.halo('halo', cfg[2], 32, 30, 31, s === 'triggered' ? .6 : .35, s === 'triggered' || s === 'pending' ? 'hm-breathe' : '');
  r += `<g${s === 'triggered' ? ' class="hm-shake"' : ''}>`;
  r += `<path d="${shield}" transform="translate(0 2.5)" fill="${s === 'disarmed' ? SHADOW : '#000'}" opacity="${s === 'disarmed' ? 1 : .12}"/>`;
  r += `<path d="${shield}" fill="${fill}" stroke="${s === 'disarmed' ? LINE : 'none'}"/>`;
  r += P.hi(`<path d="M17 15.5 32 10l15 5.5v4H17Z" fill="#fff" opacity=".28"/>`);
  const w = `fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
  if (s === 'disarmed') r += `<g ${w.replace('#fff', '#6F7884')}><path d="M26 31v-3.5a6 6 0 0 1 11.6-2.2"/><rect x="24" y="31" width="16" height="11" rx="3"/></g>`;
  if (s === 'armed_home') r += `<path d="M23 32 32 24l9 8M26 30v10h12V30" ${w}/>`;
  if (s === 'armed_away') r += `<g ${w}><path d="M24 25h9v16h-9Z"/><path d="M36 33h7M40 29.5l3.5 3.5-3.5 3.5"/></g>`;
  if (s === 'armed_night') r += `<path d="M36 23.5a9 9 0 1 0 6 13.5 7.5 7.5 0 0 1-6-13.5Z" fill="#fff"/>`;
  if (s === 'arming') r += `<circle cx="32" cy="32" r="8" ${w} stroke-dasharray="4 3.2" class="hm-spin-slow" style="animation-duration:4s;transform-origin:32px 32px"/><circle cx="32" cy="32" r="2.4" fill="#fff"/>`;
  if (s === 'pending') r += `<g ${w}><path d="M26 23h12M26 41h12M27.5 23c0 6 9 6 9 9s-9 3-9 9M36.5 23c0 6-9 6-9 9s9 3 9 9"/></g>`;
  if (s === 'triggered') r += `<g fill="#fff"><path d="M32 21.5a6.5 6.5 0 0 0-6.5 6.5v5.5l-2.5 3.5h18l-2.5-3.5V28a6.5 6.5 0 0 0-6.5-6.5Z"/><circle cx="32" cy="40" r="2.4"/></g>`;
  r += `</g>`;
  return r;
}

// ---------- Security camera ----------
function camera(s, P) {
  const off = s === 'off';
  const body = whiteBody(P);
  const lens = s === 'streaming' ? P.rg('lens', [[0, '#C9F0FF'], [.5, '#3A8DFF'], [1, '#1A2C5A']], '#3A8DFF', .4, .4, .6)
    : P.rg('lens', [[0, '#5A6475'], [.6, '#1E232C'], [1, '#0C0F14']], '#1E232C', .4, .4, .6);
  let r = '';
  if (s === 'recording') r += P.halo('halo', '#FF4B3A', 40, 30, 26, .35);
  if (s === 'streaming') {
    r += P.halo('halo', '#3AA0FF', 40, 30, 26, .35);
    for (const d of [0, -1.5]) r += `<path class="hm-ping" style="transform-origin:51px 30px;animation-delay:${d}s" d="M55 22a11 11 0 0 1 0 16" fill="none" stroke="#3A8DFF" stroke-width="2" stroke-linecap="round"/>`;
  }
  r += `<rect x="4" y="24" width="7" height="24" rx="2" fill="#8D96A2"/><path d="M11 36h6l4-6" fill="none" stroke="#8D96A2" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  r += `<g transform="rotate(12 34 28)"><rect x="17" y="21.5" width="32" height="17" rx="6" fill="${SHADOW}"/><rect x="17" y="19" width="32" height="17" rx="6" fill="${body}" stroke="${LINE}"/>`;
  r += `<path d="M15 17h34a3 3 0 0 1 3 3v1H13v-1a3 3 0 0 1 2-3Z" fill="#596270"/>`;
  r += `<circle cx="44" cy="27.5" r="6" fill="#2A313C"/><circle cx="44" cy="27.5" r="4.2" fill="${lens}"/>`;
  r += P.hi(`<circle cx="42.6" cy="26" r="1.2" fill="#fff" opacity=".8"/>`);
  r += `<circle cx="23" cy="27.5" r="1.8" fill="${s === 'recording' ? '#FF3B30' : s === 'streaming' ? '#3A8DFF' : s === 'idle' ? '#22D877' : '#A3ACB8'}"${s === 'recording' ? ' class="hm-twinkle"' : ''}/></g>`;
  if (off) r += `<path d="M12 12 52 52" stroke="#EF4438" stroke-width="3" stroke-linecap="round"/>`;
  return r;
}

// ---------- Siren ----------
function siren(s, P) {
  const on = s === 'on';
  const dome = on ? P.rg('dome', [[0, '#FFD0C8'], [.5, '#FF4B3A'], [1, '#B81E14']], '#EF4438', .4, .3, .75) : P.rg('dome', [[0, '#FBFCFD'], [1, '#B4BCC7']], '#D3D9E0', .4, .3, .75);
  let r = '';
  if (on) {
    r += P.halo('halo', '#FF4B3A', 32, 30, 32, .6);
    const rays = [-150, -120, -90, -60, -30].map(a => { const t = a * Math.PI / 180; return `<path d="M${(32 + 20 * Math.cos(t)).toFixed(1)} ${(34 + 20 * Math.sin(t)).toFixed(1)}L${(32 + 26 * Math.cos(t)).toFixed(1)} ${(34 + 26 * Math.sin(t)).toFixed(1)}"/>`; }).join('');
    r += `<g class="hm-rays" ${o(32, 34)} stroke="#FF5A3A" stroke-width="2.6" stroke-linecap="round">${rays}</g>`;
  }
  r += `<path d="M18 46V34a14 14 0 0 1 28 0v12Z" fill="${dome}"${on ? '' : ` stroke="${LINE}"`}/>`;
  if (on) r += `<path d="M24 46V34a8 8 0 0 1 4-7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".55" class="hm-twinkle"/>`;
  else r += P.hi(`<path d="M24 44V34a8 8 0 0 1 4-7" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".8"/>`);
  r += `<rect x="13" y="46" width="38" height="8" rx="3" fill="${P.lg('base', [[0, '#5A6372'], [1, '#353C47']], '#454D59')}"/>`;
  r += P.hi(`<rect x="15" y="47" width="34" height="2" rx="1" fill="#fff" opacity=".18"/>`);
  return r;
}

// ---------- Person ----------
function person(s, P) {
  const home = s === 'home';
  const bg = home ? P.lg('bg', [[0, '#FFE3B0'], [1, '#F2A33A']], '#F5B54A') : P.lg('bg', [[0, '#E9EDF1'], [1, '#B4BCC7']], '#C9D0D9');
  const fig = home ? P.lg('fig', [[0, '#FFFFFF'], [1, '#FFF1DA']], '#FFFFFF') : P.lg('fig', [[0, '#FFFFFF'], [1, '#E3E8EE']], '#F5F7F9');
  let r = '';
  if (home) r += P.halo('halo', '#FFB84D', 30, 30, 30, .35, '');
  r += `<circle cx="30" cy="32.5" r="23" fill="${SHADOW}"/><circle cx="30" cy="30" r="23" fill="${bg}"/>`;
  r += `<defs><clipPath id="${home ? 'pc-h' : 'pc-a'}${P.soft ? 'g' : 'c'}"><circle cx="30" cy="30" r="23"/></clipPath></defs>`;
  r += `<g clip-path="url(#${home ? 'pc-h' : 'pc-a'}${P.soft ? 'g' : 'c'})" fill="${fig}"><circle cx="30" cy="24" r="8.5"/><path d="M12 56c0-11 8-18 18-18s18 7 18 18Z"/></g>`;
  if (home) r += homeBadge(47, 48, '#22B46A');
  else r += badge(47, 48, '#3A8DFF', `<path d="M47 52.5s-4-3.7-4-6.6a4 4 0 0 1 8 0c0 2.9-4 6.6-4 6.6Z" fill="#fff"/><circle cx="47" cy="45.9" r="1.4" fill="#3A8DFF"/>`);
  return r;
}

// ---------- Ceiling detector (smoke, CO) ----------
function detector(P, active, c, haloC) {
  let r = '';
  if (active) r += P.halo('halo', haloC, 32, 30, 31, .5);
  r += `<ellipse cx="32" cy="22.5" rx="23" ry="9" fill="${SHADOW}"/>`;
  r += `<path d="M9 18a23 7 0 0 0 46 0v3a23 9 0 0 1-46 0Z" fill="${P.lg('rim', [[0, '#E3E8EE'], [1, '#B4BCC7']], '#C9D0D9')}"/>`;
  r += `<ellipse cx="32" cy="18" rx="23" ry="7" fill="${whiteBody(P)}" stroke="${LINE}"/>`;
  r += `<g fill="none" stroke="#9AA3AF" stroke-opacity=".5" stroke-width="1"><ellipse cx="32" cy="18" rx="15" ry="4.4"/><ellipse cx="32" cy="18" rx="8" ry="2.4"/></g>`;
  r += `<circle cx="32" cy="18" r="1.8" fill="${active ? c : '#22D877'}"${active ? ' class="hm-twinkle" style="animation-duration:.8s"' : ''}/>`;
  return r;
}
function smoke(s, P) {
  const on = s === 'detected';
  let r = detector(P, on, '#FF3B30', '#FF4B3A');
  if (on) r += `<g fill="#9AA3AF"><circle class="hm-bubble" cx="24" cy="44" r="5"/><circle class="hm-bubble" style="animation-delay:-.7s" cx="34" cy="46" r="6.5"/><circle class="hm-bubble" style="animation-delay:-1.3s" cx="43" cy="43" r="4.5"/></g>` + alertBadge(48, 52);
  else r += `<path d="M22 42c4-2.5 8 2.5 12 0s8 0 8 0" fill="none" stroke="#C9D0D9" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
  return r;
}
function co(s, P) {
  const on = s === 'detected';
  let r = detector(P, on, '#FF3B30', '#FF4B3A');
  r += `<rect x="19" y="34" width="26" height="15" rx="5" fill="${on ? '#EF4438' : '#E3E8EE'}" stroke="${on ? 'none' : LINE}"/>`;
  r += `<g fill="none" stroke="${on ? '#fff' : '#6F7884'}" stroke-width="2.4" stroke-linecap="round"><path d="M29 38.3a4.2 4.2 0 1 0 0 6.4"/><circle cx="36.6" cy="41.5" r="3.6"/></g>`;
  if (on) r += alertBadge(48, 52);
  return r;
}

// ---------- Leak sensor ----------
function leak(s, P) {
  const wet = s === 'wet';
  let r = '';
  if (wet) {
    r += P.halo('halo', '#3AA0FF', 32, 46, 28, .45);
    r += `<ellipse cx="32" cy="52" rx="26" ry="6" fill="${P.rg('puddle', [[0, '#9EDCFF'], [1, '#2D8FE0']], '#56AEF0', .5, .4, .7)}" class="hm-breathe"/>`;
  }
  r += `<path class="${wet ? 'hm-drip2' : ''}" d="M32 6c-5 7.5-7.5 11-7.5 14.5a7.5 7.5 0 0 0 15 0C39.5 17 37 13.5 32 6Z" fill="${wet ? P.lg('drop', [[0, '#9EDCFF'], [1, '#2D8FE0']], '#3A98E8') : P.lg('drop', [[0, '#F2F5F8'], [1, '#B9C2CC']], '#D2D8E0')}"${wet ? '' : ` stroke="${LINE}"`}/>`;
  r += `<rect x="14" y="${wet ? 39 : 40.5}" width="36" height="12" rx="6" fill="${SHADOW}"/>`;
  r += `<rect x="14" y="38" width="36" height="12" rx="6" fill="${whiteBody(P)}" stroke="${LINE}"/>`;
  r += `<g fill="#8D96A2"><circle cx="22" cy="49.5" r="1.4"/><circle cx="42" cy="49.5" r="1.4"/></g>`;
  r += ledDot(32, 44, wet ? '#3A8DFF' : '#22D877', wet ? 'hm-twinkle' : '');
  if (wet) r += alertBadge(49, 14, '#3A8DFF');
  return r;
}

// ---------- Gas detector ----------
function gas(s, P) {
  const on = s === 'detected';
  let r = '';
  if (on) r += P.halo('halo', '#FFB020', 32, 32, 31, .5);
  r += shadowed(13, 9, 38, 46, 9, whiteBody(P));
  r += `<g fill="#9AA3AF" opacity=".5">${Array.from({ length: 3 }, (_, i) => `<rect x="21" y="${15 + i * 4}" width="22" height="1.8" rx=".9"/>`).join('')}</g>`;
  const fl = on ? P.lg('flame', [[0, '#FFE58A'], [.55, '#FFAE1A'], [1, '#F08A2E']], '#FFB020') : P.lg('flame', [[0, '#E3E8EE'], [1, '#B4BCC7']], '#C9D0D9');
  r += `<g${on ? ` class="hm-flicker" ${o(32, 47)}` : ''}><path d="M32 28c3.6 4.5 7.5 7 7.5 12a7.5 7.5 0 0 1-15 0c0-3 1.8-5 3.4-7 .4 2 1.3 3.2 2.5 3.8-.4-3 .3-6 1.6-8.8Z" fill="${fl}"/></g>`;
  r += ledDot(42.5, 49.5, on ? '#FF3B30' : '#22D877', on ? 'hm-twinkle' : '');
  if (on) r += alertBadge(49, 50);
  return r;
}

// ---------- Problem (device health) ----------
function problem(s, P) {
  const bad = s === 'problem';
  const screen = P.lg('screen', [[0, '#2C3443'], [1, '#10141B']], '#1D232E');
  let r = '';
  if (bad) r += P.halo('halo', '#FF4B3A', 32, 30, 31, .5);
  r += `<g${bad ? ' class="hm-shake"' : ''}>`;
  r += shadowed(9, 12, 46, 36, 8, whiteBody(P));
  r += `<rect x="14" y="17" width="36" height="26" rx="4" fill="${screen}"/>`;
  r += bad ? `<path d="M15 32h7l3-7 5 13 4-10 3 4h12" fill="none" stroke="#FF5A4A" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
    : `<path d="M15 31h9l2.5-4 3.5 8 3-6 2 2h14" fill="none" stroke="#33C27F" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  r += `<rect x="26" y="50" width="12" height="4" rx="2" fill="#8D96A2"/></g>`;
  r += bad ? alertBadge(49, 49) : checkBadge(49, 49);
  return r;
}

// ---------- Connectivity ----------
function connectivity(s, P) {
  const up = s === 'connected';
  let r = '';
  if (up) r += P.halo('halo', '#2CD3C0', 32, 24, 26, .35);
  const arcs = [[18, 8], [12, 13.5], [6, 19]].map(([r0], i) => `<path d="M${32 - r0} ${30 - r0 * .25}a${r0} ${r0} 0 0 1 ${2 * r0} 0" ${up ? `class="hm-twinkle" style="animation-delay:${-.4 * (2 - i)}s"` : ''}/>`).join('');
  r += `<g fill="none" stroke="${up ? '#20B2AC' : '#B4BCC7'}" stroke-width="3.2" stroke-linecap="round">${arcs}</g>`;
  r += `<circle cx="32" cy="31" r="2.6" fill="${up ? '#20B2AC' : '#B4BCC7'}"/>`;
  r += shadowed(10, 38, 44, 15, 6, whiteBody(P));
  r += `<g fill="#8D96A2"><rect x="16" y="33" width="2" height="6" rx="1"/><rect x="46" y="33" width="2" height="6" rx="1"/></g>`;
  for (const [x, i] of [[18, 0], [24, 1], [30, 2]]) r += ledDot(x, 45.5, up ? '#22D877' : i === 0 ? '#EF4438' : '#A3ACB8', up ? 'hm-twinkle' : '');
  if (!up) r += slashBadge(48, 14);
  return r;
}

// ---------- Battery ----------
function battery(s, P) {
  const lvl = { full: 1, half: .55, low: .22, empty: .06, charging: .62 }[s];
  const c = { full: [[0, '#8BEAB4'], [1, '#22B46A']], half: [[0, '#8BEAB4'], [1, '#22B46A']], low: [[0, '#FFDC80'], [1, '#F59E0B']], empty: [[0, '#FFA293'], [1, '#EF4438']], charging: [[0, '#8BEAB4'], [1, '#22B46A']] }[s];
  const flat = { full: '#22B46A', half: '#22B46A', low: '#F59E0B', empty: '#EF4438', charging: '#22B46A' }[s];
  const fill = P.lg('cell', c, flat, 0, 0, 0, 1);
  let r = '';
  if (s === 'charging') r += P.halo('halo', '#2EDB86', 32, 32, 30, .4);
  if (s === 'empty') r += P.halo('halo', '#FF4B3A', 32, 32, 30, .35);
  r += shadowed(6, 18, 46, 28, 7, whiteBody(P));
  r += `<rect x="52" y="26" width="5" height="12" rx="2" fill="#8D96A2"/>`;
  const w = 38 * lvl;
  r += `<rect x="10" y="22" width="38" height="20" rx="4" fill="#E3E8EE"/>`;
  r += `<g${s === 'charging' ? ` class="hm-breathe"` : ''}><rect x="10" y="22" width="${w.toFixed(1)}" height="20" rx="4" fill="${fill}"/></g>`;
  r += P.hi(`<rect x="12" y="24" width="${Math.max(2, w - 4).toFixed(1)}" height="4" rx="2" fill="#fff" opacity=".35"/>`);
  if (s === 'charging') r += `<path d="M31.5 23.5 24.5 33h6l-1.6 7.5 7.6-10.5h-6Z" fill="#fff" stroke="#1E9C5A" stroke-width="1" stroke-linejoin="round"/>`;
  if (s === 'empty') r += alertBadge(48, 49);
  return r;
}

// ---------- Running (machine) ----------
function gearPath(cx, cy, R, teeth) {
  const pts = [];
  for (let i = 0; i < teeth * 2; i++) {
    const rr = i % 2 ? R * .78 : R;
    for (const da of [-.32, .32]) {
      const a = (i + .5 + da) * Math.PI / teeth;
      pts.push(`${(cx + rr * Math.cos(a)).toFixed(2)} ${(cy + rr * Math.sin(a)).toFixed(2)}`);
    }
  }
  return `M${pts.join('L')}Z`;
}
function running(s, P) {
  const on = s === 'running';
  const g1 = on ? P.lg('g1', [[0, '#86F3DA'], [1, '#1487A5']], '#20B2AC') : P.lg('g1', [[0, '#E3E8EE'], [1, '#A7B0BC']], '#B4BCC7');
  const g2 = on ? P.lg('g2', [[0, '#FFE58A'], [1, '#F2A33A']], '#F5B54A') : P.lg('g2', [[0, '#E3E8EE'], [1, '#A7B0BC']], '#C9D0D9');
  let r = '';
  if (on) r += P.halo('halo', '#2CD3C0', 32, 32, 31, .4);
  const big = `<path d="${gearPath(25, 27, 16, 9)}" fill="${g1}"/><circle cx="25" cy="27" r="5.5" fill="#fff"/><circle cx="25" cy="27" r="2.4" fill="${on ? '#1487A5' : '#8D96A2'}"/>`;
  const small = `<path d="${gearPath(44.5, 44.5, 10.5, 7)}" fill="${g2}"/><circle cx="44.5" cy="44.5" r="3.6" fill="#fff"/>`;
  r += on ? `<g class="hm-spin-slow" style="animation-duration:5s;transform-origin:25px 27px">${big}</g><g class="hm-spin-slow" style="animation-duration:3.9s;animation-direction:reverse;transform-origin:44.5px 44.5px">${small}</g>` : big + small;
  return r;
}

// ---------- Vibration ----------
function vibration(s, P) {
  const on = s === 'detected';
  let r = '';
  if (on) {
    r += P.halo('halo', '#FFB020', 32, 32, 30, .4);
    r += `<g fill="none" stroke="#F2A33A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" class="hm-twinkle" style="animation-duration:.9s"><path d="M8 22l3 4-3 4 3 4-3 4 3 4"/><path d="M56 22l-3 4 3 4-3 4 3 4-3 4"/></g>`;
  }
  r += `<g${on ? ' class="hm-shake" style="animation-duration:.6s"' : ''}>`;
  r += shadowed(17, 14, 30, 36, 9, whiteBody(P));
  r += `<g fill="none" stroke="${on ? '#F2A33A' : '#9AA3AF'}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"${on ? '' : ' opacity=".6"'}><path d="M22 32h4l2.5-6 3.5 12 3-9 2 3h5"/></g>`;
  r += ledDot(32, 44, on ? '#F2A33A' : '#22D877') + `</g>`;
  return r;
}

// ---------- Sound ----------
function sound(s, P) {
  const on = s === 'detected';
  const mic = on ? P.lg('mic', [[0, '#D9CCFF'], [1, '#8B5CF6']], '#A98BFF') : P.lg('mic', [[0, '#FFFFFF'], [1, '#C9D0DA']], '#E3E7ED');
  let r = '';
  if (on) {
    r += P.halo('halo', '#9B6BFF', 32, 26, 30, .45);
    for (const d of [0, -1]) r += `<g class="hm-ping" style="transform-origin:32px 24px;animation-delay:${d}s" fill="none" stroke="#8B5CF6" stroke-width="2.2" stroke-linecap="round"><path d="M15 15a20 20 0 0 0 0 18"/><path d="M49 15a20 20 0 0 1 0 18"/></g>`;
  }
  r += `<rect x="24" y="7" width="16" height="28" rx="8" fill="${mic}" stroke="${LINE}"/>`;
  r += `<g stroke="${on ? '#fff' : '#9AA3AF'}" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"><path d="M28 15h8M28 19.5h8M28 24h8"/></g>`;
  r += P.hi(`<path d="M27.5 11v6" stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`);
  r += `<path d="M18 28a14 14 0 0 0 28 0" fill="none" stroke="#8D96A2" stroke-width="3" stroke-linecap="round"/><path d="M32 42v9M24 53h16" stroke="#8D96A2" stroke-width="3" stroke-linecap="round"/>`;
  return r;
}

// ---------- Update ----------
function update(s, P) {
  const tile = s === 'available' ? P.lg('tile', [[0, '#9CC8FF'], [1, '#2D6FD8']], '#3A8DFF', 0, 0, 1, 1)
    : s === 'installing' ? P.lg('tile', [[0, '#C4B0FF'], [1, '#6D5BD6']], '#8B7BFF', 0, 0, 1, 1)
    : P.lg('tile', [[0, '#E9EDF1'], [1, '#B4BCC7']], '#C9D0D9', 0, 0, 1, 1);
  let r = '';
  if (s !== 'up_to_date') r += P.halo('halo', s === 'available' ? '#3AA0FF' : '#9B6BFF', 32, 30, 30, .4);
  r += `<rect x="10" y="10.5" width="42" height="42" rx="12" fill="${SHADOW}"/><rect x="10" y="8" width="42" height="42" rx="12" fill="${tile}"/>`;
  r += P.hi(`<rect x="13" y="10.5" width="36" height="7" rx="3.5" fill="#fff" opacity=".22"/>`);
  if (s === 'available') r += `<g class="hm-bob" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M31 18v16M24 28l7 7 7-7"/></g><path d="M21 40h20" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/><circle cx="50" cy="11" r="5" fill="#EF4438" stroke="#fff" stroke-width="2"/>`;
  else if (s === 'installing') r += `<circle cx="31" cy="29" r="11" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3.4"/><circle cx="31" cy="29" r="11" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="24 70" class="hm-spin" style="transform-origin:31px 29px"/>`;
  else r += `<g fill="none" stroke="#6F7884" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M31 18v14M24 25l7 7 7-7"/><path d="M21 40h20"/></g>` + checkBadge(49, 49);
  return r;
}

// ---------- Humidity ----------
function humidity(s, P) {
  const cfg = {
    humid: [[[0, '#9EDCFF'], [1, '#2D6FD8']], '#3A8DFF', 16, '#3AA0FF'],
    comfortable: [[[0, '#8BEAB4'], [1, '#22B46A']], '#2FBF77', 30, null],
    dry: [[[0, '#FFDC80'], [1, '#F59E0B']], '#F5A524', 42, '#FFB020'],
  }[s];
  const fill = P.lg('water', cfg[0], cfg[1]);
  const drop = 'M32 6c-9 12.5-15 20-15 28.5a15 15 0 0 0 30 0C47 26 41 18.5 32 6Z';
  const cid = `hc-${s}-${P.soft ? 'g' : 'c'}`;
  let r = '';
  if (cfg[3]) r += P.halo('halo', cfg[3], 32, 36, 28, .4, '');
  r += `<defs><clipPath id="${cid}"><path d="${drop}"/></clipPath></defs>`;
  r += `<path d="${drop}" transform="translate(0 2.5)" fill="${SHADOW}"/><path d="${drop}" fill="${whiteBody(P)}" stroke="${LINE}"/>`;
  r += `<g clip-path="url(#${cid})"><g${s === 'humid' ? ` class="hm-rise" ${o(32, 50)}` : ''}><path d="M10 ${cfg[2]}c4-2 8 2 12 0s8-2 12 0 8 2 12 0 8-2 12 0V52H10Z" fill="${fill}"/></g></g>`;
  r += P.hi(`<path d="M24 30c0-4 2.5-8 5-11" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>`);
  if (s === 'dry') r += `<path d="M27 38l3 3-2 3 3 3" fill="none" stroke="#B86E00" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/>`;
  return r;
}

// ---------- Air quality ----------
function air(s, P) {
  const c = { good: ['#22B46A', '#2EDB86'], fair: ['#F59E0B', '#FFB020'], poor: ['#EF4438', '#FF4B3A'] }[s];
  let r = '';
  r += P.halo('halo', c[1], 32, 32, 30, s === 'poor' ? .5 : .3, s === 'poor' ? 'hm-breathe' : '');
  r += `<circle cx="32" cy="34.5" r="24" fill="${SHADOW}"/><circle cx="32" cy="32" r="24" fill="${whiteBody(P)}" stroke="${LINE}"/>`;
  r += `<g fill="none" stroke="${c[0]}" stroke-width="3" stroke-linecap="round"><path d="M16 26h18a5 5 0 1 0-5-5"/><path d="M16 33h26a5 5 0 1 1-5 5"/><path d="M16 40h10"/></g>`;
  if (s !== 'good') {
    const dots = s === 'poor' ? [[22, 19, 1.8], [44, 24, 2.2], [40, 46, 1.6], [24, 47, 2], [48, 36, 1.5]] : [[44, 23, 1.8], [24, 47, 1.6]];
    r += `<g fill="${c[0]}">${dots.map(([x, y, rr], i) => `<circle cx="${x}" cy="${y}" r="${rr}" class="hm-twinkle" style="animation-delay:${-i * .5}s"/>`).join('')}</g>`;
  } else r += `<path d="M38 46c0-4.5 3-7 8-7 0 4.8-3 7-8 7Z" fill="${P.lg('leaf', [[0, '#A8F2C8'], [1, '#2DBE76']], '#3DCB85', 0, 1, 1, 0)}"/>`;
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
  { key: 'window', name: 'Window', fn: windowIcon, states: ['closed', 'open'] },
  { key: 'garage', name: 'Garage door', fn: garage, states: ['closed', 'open', 'opening', 'closing'] },
  { key: 'gate', name: 'Gate', fn: gate, states: ['closed', 'open', 'opening', 'closing'] },
  { key: 'curtain', name: 'Curtains', fn: curtain, states: ['closed', 'partial', 'open', 'opening', 'closing'] },
  { key: 'tv', name: 'TV', fn: tv, states: ['playing', 'paused', 'on', 'off'] },
  { key: 'speaker', name: 'Speaker', fn: speaker, states: ['playing', 'paused', 'on', 'off'] },
  { key: 'vacuum', name: 'Robot vacuum', fn: vacuum, states: ['cleaning', 'returning', 'docked', 'paused', 'idle', 'error'] },
  { key: 'mower', name: 'Robot mower', fn: mower, states: ['mowing', 'returning', 'docked', 'paused', 'error'] },
  { key: 'humidifier', name: 'Humidifier', fn: humidifier, states: ['humidifying', 'drying', 'idle', 'off'] },
  { key: 'water_heater', name: 'Water heater', fn: waterHeater, states: ['heating', 'eco', 'off'] },
  { key: 'valve', name: 'Valve', fn: valve, states: ['open', 'closed', 'opening', 'closing'] },
  { key: 'alarm', name: 'Alarm panel', fn: alarm, states: ['disarmed', 'armed_home', 'armed_away', 'armed_night', 'arming', 'pending', 'triggered'] },
  { key: 'camera', name: 'Camera', fn: camera, states: ['recording', 'streaming', 'idle', 'off'] },
  { key: 'siren', name: 'Siren', fn: siren, states: ['on', 'off'] },
  { key: 'person', name: 'Person', fn: person, states: ['home', 'away'] },
  { key: 'smoke', name: 'Smoke alarm', fn: smoke, states: ['detected', 'clear'] },
  { key: 'co', name: 'CO alarm', fn: co, states: ['detected', 'clear'] },
  { key: 'gas', name: 'Gas detector', fn: gas, states: ['detected', 'clear'] },
  { key: 'leak', name: 'Leak sensor', fn: leak, states: ['wet', 'dry'] },
  { key: 'problem', name: 'Problem', fn: problem, states: ['problem', 'ok'] },
  { key: 'connectivity', name: 'Connectivity', fn: connectivity, states: ['connected', 'disconnected'] },
  { key: 'battery', name: 'Battery', fn: battery, states: ['full', 'half', 'low', 'empty', 'charging'] },
  { key: 'running', name: 'Running', fn: running, states: ['running', 'stopped'] },
  { key: 'vibration', name: 'Vibration', fn: vibration, states: ['detected', 'clear'] },
  { key: 'sound', name: 'Sound', fn: sound, states: ['detected', 'clear'] },
  { key: 'update', name: 'Update', fn: update, states: ['available', 'installing', 'up_to_date'] },
  { key: 'humidity', name: 'Humidity sensor', fn: humidity, states: ['humid', 'comfortable', 'dry'] },
  { key: 'air', name: 'Air quality', fn: air, states: ['good', 'fair', 'poor'] },
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
