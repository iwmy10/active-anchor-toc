import { readFileSync } from "fs";
import { defineConfig } from "vite";
import { markdownToHtml } from "./md-to-html";
import { resolve } from "path";
import { globSync } from "glob";

console.log("---process.env.GITHUB_PAGES--------------");
console.log(JSON.stringify(process.env.BASE_PATH));
console.log("---process.env.GITHUB_PAGES--------------");

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
