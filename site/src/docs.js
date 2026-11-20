// Docs pages: live demos and code blocks, plus the "on this page" highlight.
import { $$, start } from "./common.js";
import { mountDemos } from "./demos.js";

mountDemos();
start();

const links = new Map($$(".on-page a").map((a) => [a.getAttribute("href").slice(1), a]));
if (links.size && "IntersectionObserver" in window) {
  const seen = new Set();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) e.isIntersecting ? seen.add(e.target.id) : seen.delete(e.target.id);
      const first = [...links.keys()].find((id) => seen.has(id));
      if (first) for (const [id, a] of links) a.classList.toggle("active", id === first);
    },
    { rootMargin: "-70px 0px -60% 0px" },
  );
  for (const id of links.keys()) {
    const h = document.getElementById(id);
    if (h) io.observe(h);
  }
}
