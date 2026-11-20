// Builds the Moments website into site/_site: the home page, the gallery and the docs.
//   node site/build.mjs           build once
//   node site/build.mjs --serve   build, serve on http://localhost:4173 and rebuild on change
// The site is not part of the release: the release ships dist/ha-moments.js and the backdrops only.
import * as esbuild from "esbuild";
import { Marked } from "marked";
import { createServer } from "node:http";
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, watch, writeFileSync, existsSync } from "node:fs";
import { dirname, extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import * as mdi from "@mdi/js";

const SITE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(SITE, "..");
const OUT = join(SITE, "_site");
const { version } = JSON.parse(readFileSync(join(REPO, "package.json"), "utf8"));
const REPO_URL = "https://github.com/westonfleming/ha-moments";
const SITE_URL = (process.env.SITE_URL ?? "https://westonfleming.github.io/ha-moments/").replace(/\/?$/, "/");

// ---- Docs, in sidebar order.
const DOCS = [
  ["Get started", [["index", "Introduction"], ["install", "Install"], ["compose", "Compose a dashboard"]]],
  ["Cards", [["devices", "Device cards"], ["readings", "Metrics and area headers"], ["areas", "Areas and floors"], ["area-moments", "Area moments"], ["house", "House-wide cards"], ["outdoors", "Weather, climate and network"]]],
  ["Look and behaviour", [["icons", "Icons"], ["theme", "Theme and backdrops"], ["time-of-day", "Time of day and schedules"]]],
  ["Help", [["troubleshooting", "Updating and troubleshooting"]]],
];
const DOC_LIST = DOCS.flatMap(([, items]) => items);

const walk = (dir, exts) =>
  existsSync(dir)
    ? readdirSync(dir).flatMap((f) => {
        const p = join(dir, f);
        if (f === "node_modules" || f === "_site") return [];
        return statSync(p).isDirectory() ? walk(p, exts) : exts.includes(extname(f)) ? [p] : [];
      })
    : [];

// ---- Only the mdi icons the cards, examples and site name.
const mdiModule = () => {
  const names = new Set(["mdi:help-circle-outline", "mdi:lightbulb", "mdi:power-plug", "mdi:fan", "mdi:blinds-horizontal", "mdi:lock", "mdi:thermostat", "mdi:television", "mdi:checkbox-blank-circle-outline", "mdi:eye"]);
  const files = [...walk(join(REPO, "src"), [".ts"]), ...walk(join(REPO, "examples"), [".yaml"]), ...walk(join(SITE, "src"), [".js", ".ts"]), ...walk(join(SITE, "docs"), [".md"]), ...walk(join(SITE, "pages"), [".html"])];
  for (const f of files) for (const m of readFileSync(f, "utf8").matchAll(/mdi:[a-z0-9-]+/g)) names.add(m[0]);
  const paths = {};
  for (const n of names) {
    const key = "mdi" + n.slice(4).replace(/(^|-)([a-z0-9])/g, (_, __, c) => c.toUpperCase());
    if (mdi[key]) paths[n] = mdi[key];
  }
  return `export const PATHS = ${JSON.stringify(paths)};`;
};
const mdiPlugin = {
  name: "mdi",
  setup(b) {
    b.onResolve({ filter: /^virtual:mdi$/ }, () => ({ path: "mdi", namespace: "virtual" }));
    b.onLoad({ filter: /.*/, namespace: "virtual" }, () => ({ contents: mdiModule(), loader: "js" }));
  },
};

// ---- Page shell.
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const ICON_GH = `<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2Z"/></svg>`;
const LOGO = `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><defs><radialGradient id="lg" cx="50%" cy="42%" r="60%"><stop offset="0" stop-color="#ffd58a"/><stop offset=".55" stop-color="#f2a33a"/><stop offset="1" stop-color="#c76a08"/></radialGradient></defs><rect width="32" height="32" rx="9" fill="#14171d"/><circle cx="16" cy="15" r="8.5" fill="#f2a33a" opacity=".22"/><circle cx="16" cy="15" r="5.6" fill="url(#lg)"/><rect x="12.6" y="22" width="6.8" height="2.4" rx="1.2" fill="#9aa1ad"/></svg>`;

const layout = ({ title, description, root, body, script, active, bodyClass = "" }) => `<!doctype html>
<html lang="en" data-root="${root}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:type" content="website">
<meta property="og:image" content="${SITE_URL}img/home-view-dark.png">
<meta name="twitter:card" content="summary_large_image">
<meta name="theme-color" content="#0b0d11" media="(prefers-color-scheme: dark)">
<meta name="theme-color" content="#f3f4f6" media="(prefers-color-scheme: light)">
<link rel="icon" href="${root}favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">
<link rel="stylesheet" href="${root}assets/site.css">
<script>try{var t=localStorage.getItem("moments-site-theme");if(t&&t!=="auto")document.documentElement.dataset.theme=t}catch(e){}</script>
</head>
<body class="${bodyClass}">
<a class="skip" href="#content">Skip to content</a>
<header class="top"><div class="top-in">
  <a class="brand" href="${root}index.html">${LOGO}<b>Moments</b><span class="ver">${version}</span></a>
  <nav class="nav" aria-label="Site">
    <a href="${root}gallery.html"${active === "gallery" ? ' aria-current="page"' : ""}>Gallery</a>
    <a href="${root}docs/index.html"${active === "docs" ? ' aria-current="page"' : ""}>Docs</a>
    <a href="${root}docs/install.html"${active === "install" ? ' aria-current="page"' : ""}>Install</a>
    <a class="gh" href="${REPO_URL}" aria-label="GitHub">${ICON_GH}<span>GitHub</span></a>
  </nav>
  <div class="seg theme-seg" role="group" aria-label="Theme">
    <button type="button" data-theme-set="auto" aria-pressed="true" title="Match the device">Auto</button><button type="button" data-theme-set="light" aria-pressed="false">Light</button><button type="button" data-theme-set="dark" aria-pressed="false">Dark</button>
  </div>
  <button type="button" id="menu-toggle" class="menu-toggle" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
</div></header>
<div id="content">
${body}
</div>
<footer class="foot"><div class="foot-in">
  <div class="foot-brand">${LOGO}<div><b>Moments</b><p>Cards, animated icons, a theme and backdrops for Home Assistant dashboards. Free and open source under the MIT licence.</p></div></div>
  <nav aria-label="Footer">
    <a href="${root}gallery.html">Gallery</a>
    <a href="${root}docs/index.html">Docs</a>
    <a href="${REPO_URL}/releases">Releases</a>
    <a href="${REPO_URL}/issues">Issues</a>
    <a href="${REPO_URL}">GitHub</a>
  </nav>
  <p class="fine">Version ${version}. Every card on this site is the real card, drawn against a made-up home. Not affiliated with Home Assistant or the Open Home Foundation.</p>
</div></footer>
<script type="module" src="${root}assets/${script}.js"></script>
</body>
</html>
`;

// ---- Markdown docs.
const slug = (s) => s.toLowerCase().replace(/<[^>]+>/g, "").replace(/&#?\w+;/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const renderDoc = (md) => {
  const headings = [];
  const marked = new Marked({
    gfm: true,
    walkTokens(t) {
      if (t.type === "link" && !/^[a-z]+:/i.test(t.href)) {
        // Links between docs are written as .md so they also work on GitHub.
        t.href = t.href.replace(/\.md(#|$)/, ".html$1");
        // Links into the repository (examples, themes) go to GitHub.
        if (/^\.\.\/\.\.\//.test(t.href)) t.href = `${REPO_URL}/blob/main/${t.href.replace(/^(\.\.\/)+/, "")}`;
      }
    },
    renderer: {
      heading({ tokens, depth }) {
        const html = this.parser.parseInline(tokens);
        const id = slug(html);
        if (depth === 2) headings.push({ id, html });
        if (depth === 1) return `<h1>${html}</h1>\n`;
        return `<h${depth} id="${id}"><a class="anchor" href="#${id}" aria-hidden="true">#</a>${html}</h${depth}>\n`;
      },
      code({ text, lang = "" }) {
        const [l, ...flags] = lang.split(/\s+/);
        const demo = flags.includes("demo") || flags.includes("preview");
        if (demo) {
          const attrs = ["data-demo"];
          if (flags.includes("demo")) attrs.push("data-code");
          for (const f of flags) {
            const m = /^(cols|width|backdrop)=(.+)$/.exec(f);
            if (m) attrs.push(`data-${m[1]}="${esc(m[2])}"`);
            else if (f === "backdrop" || f === "narrow1") attrs.push(`data-${f}`);
          }
          return `<div class="demo" ${attrs.join(" ")}><script type="text/yaml">\n${text.replace(/<\/script/gi, "<\\/script")}\n</script></div>\n`;
        }
        return `<pre data-lang="${esc(l)}"><code>${esc(text)}</code></pre>\n`;
      },
    },
  });
  let html = marked.parse(md);
  html = html.replace(/<table>/g, '<div class="table-wrap"><table>').replace(/<\/table>/g, "</table></div>");
  return { html, headings };
};

const docSidebar = (current) =>
  `<nav class="doc-nav" aria-label="Docs">${DOCS.map(
    ([group, items]) =>
      `<p>${esc(group)}</p><ul>${items.map(([f, t]) => `<li><a href="${f}.html"${f === current ? ' aria-current="page"' : ""}>${esc(t)}</a></li>`).join("")}</ul>`,
  ).join("")}</nav>`;

const buildDocs = () => {
  mkdirSync(join(OUT, "docs"), { recursive: true });
  DOC_LIST.forEach(([file, navTitle], i) => {
    const raw = readFileSync(join(SITE, "docs", `${file}.md`), "utf8").replace(/\{\{version\}\}/g, version);
    const title = /^#\s+(.+)$/m.exec(raw)?.[1] ?? navTitle;
    const lead = /^#\s+.+\n+([^\n#|`<].+)/m.exec(raw)?.[1]?.replace(/[*_`[\]]|\(([^)]+)\)/g, "") ?? "";
    const { html, headings } = renderDoc(raw);
    const prev = DOC_LIST[i - 1], next = DOC_LIST[i + 1];
    const pager = `<nav class="pager" aria-label="Next and previous">${prev ? `<a class="prev" href="${prev[0]}.html"><span>Previous</span>${esc(prev[1])}</a>` : "<span></span>"}${next ? `<a class="next" href="${next[0]}.html"><span>Next</span>${esc(next[1])}</a>` : ""}</nav>`;
    const onPage = headings.length > 1 ? `<nav class="on-page" aria-label="On this page"><p>On this page</p><ul>${headings.map((h) => `<li><a href="#${h.id}">${h.html.replace(/<[^>]+>/g, "")}</a></li>`).join("")}</ul></nav>` : "";
    const body = `<div class="docs-layout">
  <aside class="doc-side">${docSidebar(file)}</aside>
  <main class="doc" id="main">
    <details class="doc-jump"><summary><span>Docs</span>${esc(navTitle)}</summary>${docSidebar(file)}</details>
    <article class="prose">${html}</article>
    <p class="edit"><a href="${REPO_URL}/edit/main/site/docs/${file}.md">Edit this page on GitHub</a></p>
    ${pager}
  </main>
  <aside class="doc-toc">${onPage}</aside>
</div>`;
    writeFileSync(join(OUT, "docs", `${file}.html`), layout({ title: `${title} · Moments docs`, description: lead.slice(0, 200) || `Moments docs: ${title}`, root: "../", body, script: "docs", active: file === "install" ? "install" : "docs", bodyClass: "docs-page" }));
  });
};

// ---- Pages written as HTML (home page, gallery).
const PAGES = [
  { file: "index.html", script: "landing", title: "Moments · Beautiful building blocks for Home Assistant dashboards", description: "Cards, animated device icons, a theme and backdrops for Home Assistant dashboards on phones, tablets, wall panels and desktops.", bodyClass: "home" },
  { file: "gallery.html", script: "gallery", title: "Gallery · Moments", description: "Every Moments icon and card, drawn live by the real cards, each over the YAML that draws it.", active: "gallery", bodyClass: "gallery-page" },
];
const buildPages = () => {
  for (const p of PAGES) {
    const body = readFileSync(join(SITE, "pages", p.file), "utf8").replace(/\{\{version\}\}/g, version).replace(/\{\{repo\}\}/g, REPO_URL);
    writeFileSync(join(OUT, p.file), layout({ ...p, root: "", body }));
  }
};

const buildAssets = async () => {
  await esbuild.build({
    entryPoints: { landing: join(SITE, "src/landing.js"), gallery: join(SITE, "src/gallery.js"), docs: join(SITE, "src/docs.js") },
    outdir: join(OUT, "assets"),
    bundle: true,
    splitting: true,
    format: "esm",
    target: "es2021",
    minify: true,
    chunkNames: "chunks/[name]-[hash]",
    define: { __VERSION__: JSON.stringify(version) },
    plugins: [mdiPlugin],
    logLevel: "warning",
  });
  cpSync(join(SITE, "src/site.css"), join(OUT, "assets/site.css"));
  cpSync(join(REPO, "backdrops"), join(OUT, "backdrops"), { recursive: true });
  mkdirSync(join(OUT, "img"), { recursive: true });
  for (const f of readdirSync(join(REPO, "docs"))) if (f.endsWith(".png")) cpSync(join(REPO, "docs", f), join(OUT, "img", f));
  cpSync(join(SITE, "static"), OUT, { recursive: true });
};

const build = async () => {
  const t = Date.now();
  rmSync(OUT, { recursive: true, force: true });
  mkdirSync(OUT, { recursive: true });
  await buildAssets();
  buildPages();
  buildDocs();
  console.log(`site: built ${relative(REPO, OUT)} in ${Date.now() - t} ms`);
};

await build();

if (process.argv.includes("--serve")) {
  const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".yaml": "text/yaml", ".nojekyll": "text/plain" };
  const port = Number(process.env.PORT ?? 4173);
  createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = join(OUT, p);
    if (!f.startsWith(OUT) || !existsSync(f) || statSync(f).isDirectory()) {
      res.writeHead(404).end("Not found");
      return;
    }
    res.writeHead(200, { "content-type": TYPES[extname(f)] ?? "application/octet-stream", "cache-control": "no-store" });
    res.end(readFileSync(f));
  }).listen(port, () => console.log(`site: http://localhost:${port}/`));
  let timer;
  const rebuild = () => {
    clearTimeout(timer);
    timer = setTimeout(() => build().catch((e) => console.error(e.message)), 150);
  };
  for (const d of [join(SITE, "src"), join(SITE, "docs"), join(SITE, "pages"), join(SITE, "static"), join(REPO, "src")]) watch(d, { recursive: true }, rebuild);
}
