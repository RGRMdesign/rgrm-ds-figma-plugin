import * as esbuild from "esbuild";
import { mkdirSync, readFileSync, writeFileSync } from "fs";

const watch = process.argv.includes("--watch");

async function buildUiBundle() {
  const uiHtml = readFileSync("src/ui/index.html", "utf8");

  const uiResult = await esbuild.build({
    entryPoints: ["src/ui/index.ts"],
    bundle: true,
    write: false,
    target: "es2017",
    logLevel: "silent",
  });

  const uiJs = uiResult.outputFiles[0].text;
  const html = uiHtml.replace(
    '<script src="./index.ts" type="module"></script>',
    `<script>${uiJs}</script>`
  );

  mkdirSync("dist", { recursive: true });
  writeFileSync("dist/ui.html", html);
  return html;
}

async function buildCodeBundle(html) {
  await esbuild.build({
    entryPoints: ["src/code.ts"],
    bundle: true,
    outfile: "dist/code.js",
    target: "es2017",
    logLevel: "info",
    define: {
      __html__: JSON.stringify(html),
    },
  });
}

async function build() {
  const html = await buildUiBundle();
  await buildCodeBundle(html);
  console.log("Build complete.");
}

if (watch) {
  const chokidar = await import("chokidar").catch(() => null);

  if (!chokidar) {
    console.log("Watch mode requires manual rebuilds (chokidar not installed).");
    await build();
  } else {
    await build();
    chokidar
      .watch(["src/**/*"], { ignoreInitial: true })
      .on("all", async () => {
        try {
          await build();
        } catch (error) {
          console.error(error);
        }
      });
    console.log("Watching for changes...");
  }
} else {
  await build();
}
