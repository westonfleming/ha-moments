// Shared by every page: the real Moments cards, a sample home, code blocks and the theme switch.
import "./ha-shim.ts";
import "../../src/ha-moments";
import { parse } from "yaml";
import { makeHass } from "./mock-home.js";

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
export const ROOT = document.documentElement.dataset.root ?? "";

export const isDark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
};

// ---- Live cards: every mounted card gets a fresh hass whenever the sample home changes.
let live = [];
let hassFor;
const listeners = [];
export const pushHass = () => {
  const h = hassFor(isDark());
  live = live.filter((el) => el.isConnected || el.__keep);
  for (const el of live) el.hass = h;
  for (const fn of listeners) fn(h);
};
hassFor = makeHass(() => pushHass());
export const currentHass = () => hassFor(isDark());
export const onHass = (fn) => listeners.push(fn);

/** Creates one card from its config. */
export const createCard = (cfg) => {
  const tag = String(cfg.type).replace(/^custom:/, "");
  const el = document.createElement(tag);
  el.setConfig(cfg);
  el.hass = currentHass();
  el.__keep = true;
  live.push(el);
  queueMicrotask(() => (el.__keep = false));
  return el;
};

/** Renders a card, or a grid of cards (`cards:`), into a container. Returns the configs. */
export const mountYaml = (yaml, host) => {
  let cfg;
  try {
    cfg = parse(yaml);
  } catch (e) {
    host.innerHTML = `<div class="err">YAML error: ${esc(e.message)}</div>`;
    return [];
  }
  const cards = cfg?.cards ?? (cfg ? [cfg] : []);
  for (const c of cards) {
    const slot = document.createElement("div");
    slot.className = "slot";
    // Like Home Assistant's sections: grid_options.columns "full" spans the row.
    if (c.grid_options?.columns === "full") slot.style.gridColumn = "1 / -1";
    try {
      const { grid_options, ...cfg } = c;
      slot.append(createCard(cfg));
    } catch (e) {
      slot.innerHTML = `<div class="err">${esc(c.type)}: ${esc(e.message)}</div>`;
    }
    host.append(slot);
  }
  return cards;
};

// ---- YAML: light syntax colouring, and a copy button.
const highlightLine = (line) => {
  let code = line, comment = "";
  const m = /(^|\s)#(?![^"]*"\s*$)/.exec(line);
  if (m) { code = line.slice(0, m.index + m[1].length); comment = line.slice(m.index + m[1].length); }
  const h = esc(code)
    .replace(/^(\s*(?:-\s+)?)([A-Za-z_][\w-]*)(:)(?=\s|$)/, '$1<span class="k">$2</span><span class="p">$3</span>')
    .replace(/(custom:moments-[a-z-]+)/g, '<span class="t">$1</span>')
    .replace(/\b((?:light|sensor|binary_sensor|switch|cover|climate|lock|fan|scene|script|automation|input_select|input_datetime|input_boolean|input_number|select|weather|media_player|vacuum|lawn_mower|humidifier|water_heater|valve|alarm_control_panel|camera|siren|person|device_tracker|update|button)\.[a-z0-9_]+)/g, '<span class="e">$1</span>')
    .replace(/(mdi:[a-z-]+)/g, '<span class="s">$1</span>')
    .replace(/(\s)(true|false|\d+(?:\.\d+)?)(?=\s|$|,|\])/g, '$1<span class="n">$2</span>');
  return h + (comment ? `<span class="c">${esc(comment)}</span>` : "");
};

export const codeBlock = (text, label = "YAML", lang = "yaml") => {
  const wrap = document.createElement("div");
  wrap.className = "code";
  const fmt = lang === "yaml" ? highlightLine : esc;
  wrap.innerHTML = `<div class="code-bar"><span>${esc(label)}</span><button type="button" class="copy">Copy</button></div><pre tabindex="0"><code>${text.split("\n").map(fmt).join("\n")}</code></pre>`;
  const btn = $(".copy", wrap);
  btn.addEventListener("click", () => {
    const done = () => { btn.textContent = "Copied"; setTimeout(() => (btn.textContent = "Copy"), 1600); };
    const fallback = () => {
      const r = document.createRange();
      r.selectNodeContents($("code", wrap));
      const s = getSelection();
      s.removeAllRanges();
      s.addRange(r);
      btn.textContent = "Selected";
    };
    try { navigator.clipboard.writeText(text).then(done, fallback); } catch { fallback(); }
  });
  return wrap;
};

// ---- Backdrops.
export const BACKDROPS = ["mist", "aurora", "horizon", "contour"];
// Absolute, so the URL also works inside CSS variables read by the stylesheet.
export const backdropUrl = (name, dark = isDark()) => new URL(`${ROOT}backdrops/${name}-${dark ? "dark" : "light"}.svg`, location.href).href;

// ---- Theme and icon style.
let iconStyle = "glow";
export const getIconStyle = () => iconStyle;
export const setIconStyle = (style) => {
  iconStyle = style;
  for (const i of $$("sheet-icon")) i.setAttribute("icon-style", style);
  document.documentElement.style.setProperty("--moments-icon-style", style);
  for (const b of $$("[data-icons]")) b.setAttribute("aria-pressed", String(b.dataset.icons === style));
  pushHass();
};

const themeListeners = [];
export const onTheme = (fn) => themeListeners.push(fn);
const themeChanged = () => {
  pushHass();
  for (const fn of themeListeners) fn(isDark());
};
export const setTheme = (t) => {
  if (t === "auto") delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = t;
  for (const b of $$("[data-theme-set]")) b.setAttribute("aria-pressed", String(b.dataset.themeSet === t));
  try { localStorage.setItem("moments-site-theme", t); } catch {}
  themeChanged();
};

// ---- What a tap would do inside Home Assistant.
let toastTimer;
export const toast = (msg) => {
  let t = $("#toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "toast";
    t.setAttribute("role", "status");
    document.body.append(t);
  }
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2600);
};
document.addEventListener("hass-more-info", (e) => {
  const id = e.detail?.entityId;
  const name = currentHass().states[id]?.attributes?.friendly_name ?? id;
  toast(`In Home Assistant, this opens the ${name} dialog`);
});
document.addEventListener("hass-notification", (e) => toast(e.detail?.message ?? ""));

// ---- Icons: each in its own shadow root, so gradient ids never clash.
export const defineSheetIcon = (ICONS, ICON_CSS) => {
  if (customElements.get("sheet-icon")) return;
  class SheetIcon extends HTMLElement {
    static get observedAttributes() { return ["set", "state", "icon-style"]; }
    attributeChangedCallback() { this.draw(); }
    connectedCallback() { this.draw(); }
    draw() {
      const set = this.getAttribute("set"), st = this.getAttribute("state"), style = this.getAttribute("icon-style") || iconStyle;
      if (!set || !st) return;
      const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
      root.innerHTML = `<style>${ICON_CSS}:host{display:block;width:100%;height:100%}svg{width:100%;height:100%;display:block}</style>${ICONS[style][`${set}/${st}`] ?? ""}`;
    }
  }
  customElements.define("sheet-icon", SheetIcon);
};

// ---- Start up.
export const start = () => {
  for (const b of $$("[data-icons]")) b.addEventListener("click", () => setIconStyle(b.dataset.icons));
  for (const b of $$("[data-theme-set]")) b.addEventListener("click", () => setTheme(b.dataset.themeSet));
  matchMedia("(prefers-color-scheme: dark)").addEventListener("change", themeChanged);
  let saved = "auto";
  try { saved = localStorage.getItem("moments-site-theme") || "auto"; } catch {}
  setTheme(saved);
  setIconStyle("glow");
  const menu = $("#menu-toggle");
  if (menu)
    menu.addEventListener("click", () => {
      const open = document.body.classList.toggle("nav-open");
      menu.setAttribute("aria-expanded", String(open));
    });
  // Keep "x min ago" style text fresh.
  setInterval(pushHass, 60000);
};
