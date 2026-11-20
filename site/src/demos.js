// Live demos inside pages: <div data-demo data-cols="2" data-code data-backdrop>
//   <script type="text/yaml">…card or grid YAML…</script></div>
import { $, $$, codeBlock, mountYaml, backdropUrl, onTheme } from "./common.js";

export const mountDemos = (root = document) => {
  const withBackdrop = [];
  for (const host of $$("[data-demo]", root)) {
    const src = $('script[type="text/yaml"]', host);
    const yaml = (src?.textContent ?? "").replace(/^\n+|\s+$/g, "");
    host.replaceChildren();
    const stage = document.createElement("div");
    stage.className = "stage ha" + ("backdrop" in host.dataset ? " backdrop" : "");
    const grid = document.createElement("div");
    grid.className = "cards";
    grid.style.setProperty("--cols", host.dataset.cols ?? "1");
    if (host.dataset.width) grid.style.maxWidth = `${host.dataset.width}px`;
    if ("narrow1" in host.dataset) grid.classList.add("c3m");
    stage.append(grid);
    const cards = mountYaml(yaml, grid);
    host.append(stage);
    if ("code" in host.dataset) host.append(codeBlock(yaml, cards.length > 1 ? `YAML · a section with ${cards.length} cards` : "YAML · one card"));
    if ("backdrop" in host.dataset) withBackdrop.push([stage, host.dataset.backdrop || "aurora"]);
  }
  // Plain code blocks get the same colouring and a copy button.
  for (const pre of $$("pre[data-lang]", root)) {
    const lang = pre.dataset.lang;
    const label = lang === "yaml" ? "YAML" : lang === "sh" || lang === "bash" ? "Shell" : lang ? lang.toUpperCase() : "Text";
    pre.replaceWith(codeBlock(pre.textContent.replace(/\n$/, ""), label, lang));
  }
  const paint = () => {
    for (const [stage, name] of withBackdrop) stage.style.backgroundImage = `url("${backdropUrl(name)}")`;
  };
  onTheme(paint);
  paint();
};
