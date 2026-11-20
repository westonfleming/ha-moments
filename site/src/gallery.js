// The gallery: every icon and card, drawn by the real cards against the sample home,
// each over the YAML that draws it.
import { ICONS, ICON_SETS, ICON_CSS } from "../../src/icons/generated";
import { tintFor } from "../../src/icons/resolve";
import { $, esc, codeBlock, mountYaml, defineSheetIcon, getIconStyle, backdropUrl, BACKDROPS, onTheme, start } from "./common.js";
import { SECTIONS, ICON_NOTES, THEME_YAML, COMPOSE_YAML, SET_NAMES } from "./specs.js";

defineSheetIcon(ICONS, ICON_CSS);

const stateLabel = (set, st) => (set === "blind" && /^\d+$/.test(st) ? `${st}%` : st.replace(/_/g, " "));

const renderIcons = () => {
  const grid = $("#icon-grid");
  for (const [set, list] of Object.entries(ICON_SETS)) {
    const card = document.createElement("article");
    card.className = "iconset" + (set === "blind" ? " wide" : "");
    card.id = `icon-${set}`;
    const info = ICON_NOTES[set] ?? { note: "", yaml: `type: custom:moments-tile\nentity: …\nicon_set: ${set}` };
    card.innerHTML = `<header><h3>${esc(SET_NAMES[set] ?? set)}</h3><code class="setkey">icon_set: ${set}</code></header>
      ${info.note ? `<p class="note">${esc(info.note)}</p>` : ""}
      <ul class="states">${list
        .map((st) => {
          const tint = tintFor(set, st);
          return `<li><div class="badge"${tint ? ` style="--tint:${tint}"` : ""}><sheet-icon set="${set}" state="${st}" icon-style="${getIconStyle()}"></sheet-icon></div><span>${esc(stateLabel(set, st))}</span></li>`;
        })
        .join("")}</ul>`;
    card.append(codeBlock(info.yaml));
    grid.append(card);
  }
};

const renderSpec = (spec) => {
  const art = document.createElement("article");
  art.className = "spec";
  art.id = spec.id;
  const title = spec.title ?? spec.type;
  art.innerHTML = `<header class="spec-head">
      <div><h3><code>${esc(spec.title ? spec.type : "custom:" + spec.type)}</code></h3>${spec.title ? `<p class="kicker">${esc(spec.title)}</p>` : ""}</div>
      <span class="needs"><b>Needs</b> ${esc(spec.needs)}</span>
    </header>
    <p class="blurb">${esc(spec.blurb)}</p>`;
  const stage = document.createElement("div");
  stage.className = "stage ha" + (spec.backdrop ? " backdrop" : "");
  const grid = document.createElement("div");
  grid.className = "cards";
  if (spec.width) grid.style.maxWidth = `${spec.width}px`;
  grid.style.setProperty("--cols", String(spec.cols ?? 1));
  if (spec.narrow1) grid.classList.add("c3m");
  stage.append(grid);
  const cards = mountYaml(spec.yaml, grid);
  art.append(stage, codeBlock(spec.yaml, cards.length > 1 ? `YAML · a section with ${cards.length} cards` : "YAML · one card"));
  return { art, title };
};

const renderSections = () => {
  const host = $("#card-sections");
  const toc = $("#toc-cards");
  for (const sec of SECTIONS) {
    const s = document.createElement("section");
    s.id = sec.id;
    s.className = "group";
    s.innerHTML = `<div class="group-head"><h2>${esc(sec.title)}</h2><p>${esc(sec.lede)}</p></div>`;
    const li = document.createElement("li");
    li.innerHTML = `<a href="#${sec.id}">${esc(sec.title)}</a><ul></ul>`;
    for (const spec of sec.specs) {
      const { art, title } = renderSpec(spec);
      s.append(art);
      $("ul", li).insertAdjacentHTML("beforeend", `<li><a href="#${spec.id}">${esc(title.replace(/^moments-/, ""))}</a></li>`);
    }
    host.append(s);
    toc.append(li);
  }
};

const renderBackdrops = () => {
  const host = $("#backdrop-grid");
  for (const name of BACKDROPS) {
    const fig = document.createElement("figure");
    fig.innerHTML = `<div class="pair"><img alt="${name}, light" src="${backdropUrl(name, false)}" loading="lazy"><img alt="${name}, dark" src="${backdropUrl(name, true)}" loading="lazy"></div><figcaption><code>${name}-light.svg</code> · <code>${name}-dark.svg</code></figcaption>`;
    host.append(fig);
  }
  $("#theme-code").append(codeBlock(THEME_YAML, "YAML · theme and view"));
  $("#compose-code").append(codeBlock(COMPOSE_YAML, "YAML · dashboard views"));
  const setBd = (dark) => document.documentElement.style.setProperty("--bd", `url("${backdropUrl("aurora", dark)}")`);
  onTheme(setBd);
};

renderIcons();
renderSections();
renderBackdrops();
start();
