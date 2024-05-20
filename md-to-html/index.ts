import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import { toc } from "mdast-util-toc";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import type { Compatible } from "vfile";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSlug)
  .use(rehypeAutolinkHeadings)
  .use(rehypeStringify);

const tocProcessor = unified()
  .use(remarkParse)
  .use(remarkToc)
  .use(remarkRehype)
  .use(rehypeStringify);

/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast-util-toc').Options} Options
 */
function remarkToc() {
  /**
   * Transform.
   *
   * @param {Root} tree
   *   Tree.
   * @returns {undefined}
   *   Nothing.
   */
  return function (tree) {
    const result = toc(tree);

    if (!result.map) {
      return;
    }

    tree.children = [result.map];
  };
}

export async function markdownToHtml(markdownFile: Compatible) {
  const article = String(await processor.process(markdownFile));
  const toc = String(await tocProcessor.process(markdownFile));

  return { article, toc };
}
