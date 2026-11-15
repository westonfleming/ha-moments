import * as esbuild from "esbuild";
import { readFileSync } from "node:fs";

// CI sets MOMENTS_VERSION for PR test builds (e.g. 0.3.1-pr32.7) so the console banner names the build.
const version = process.env.MOMENTS_VERSION || JSON.parse(readFileSync("package.json", "utf8")).version;

const options = {
  entryPoints: ["src/ha-moments.ts"],
  outfile: "dist/ha-moments.js",
  bundle: true,
  format: "esm",
  target: "es2021",
  minify: !process.argv.includes("--watch"),
  sourcemap: process.argv.includes("--watch") ? "inline" : false,
  define: { __VERSION__: JSON.stringify(version) },
  logLevel: "info",
};

if (process.argv.includes("--watch")) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
