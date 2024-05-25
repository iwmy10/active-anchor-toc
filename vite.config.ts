import { readFileSync } from "fs";
import { defineConfig, type Plugin } from "vite";
import { markdownToHtml } from "./md-to-html";
import { resolve } from "path";
import { globSync } from "glob";

const addBasePathToHref = (): Plugin => {
  let basePath: string;
  return {
    name: "vite-plugin-add-base-path-to-href",
    configResolved(config) {
      basePath = config.base;
    },
    transformIndexHtml(html) {
      // <a href="/
      // のように`/`から始まるaタグを取得するための正規表現
      // 後読みアサーション: (?<=...), (?<!...) - JavaScript | MDN
      // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Regular_expressions/Lookbehind_assertion
      const hrefRE = /(?<=<a(?:\s[^>]*)*\shref\s*=\s*["'])\//gi;
      return html.replace(hrefRE, basePath);
    },
  };
};

export default defineConfig({
  base: process.env.BASE_PATH || "/",
  root: resolve(__dirname, "src"),
  resolve: {},
  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: globSync("src/**/*.html"),
    },
  },
  plugins: [
    addBasePathToHref(),
    (async () => {
      const markdown = readFileSync("./content.md");
      const { article, toc } = await markdownToHtml(markdown);
      return {
        name: "html-transform",
        transformIndexHtml(html) {
          return html
            .replace("<!-- article slot -->", article)
            .replace("<!-- toc slot -->", toc);
        },
      };
    })(),
  ],
});
