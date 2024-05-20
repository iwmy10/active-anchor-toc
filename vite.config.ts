import { readFileSync } from "fs";
import { defineConfig } from "vite";
import { markdownToHtml } from "./md-to-html";
import { resolve } from "path";
import { globSync } from "glob";

export default defineConfig({
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
