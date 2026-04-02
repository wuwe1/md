import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import rehypeSlug from "rehype-slug";
import rehypeShikiFromHighlighter from "@shikijs/rehype/core";
import { createHighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import type { HighlighterCore } from "shiki/core";
import type { Root, Element, ElementContent } from "hast";

const schema: typeof defaultSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    h1: [...(defaultSchema.attributes?.h1 ?? []), "id"],
    h2: [...(defaultSchema.attributes?.h2 ?? []), "id"],
    h3: [...(defaultSchema.attributes?.h3 ?? []), "id"],
    h4: [...(defaultSchema.attributes?.h4 ?? []), "id"],
    h5: [...(defaultSchema.attributes?.h5 ?? []), "id"],
    h6: [...(defaultSchema.attributes?.h6 ?? []), "id"],
    input: [...(defaultSchema.attributes?.input ?? []), ["type", "checkbox"], "checked", "disabled"],
  },
  tagNames: [...(defaultSchema.tagNames ?? []), "input"],
};

function getTextContent(node: Element): string {
  let text = "";
  for (const child of node.children) {
    if (child.type === "text") text += child.value;
    else if ("children" in child) text += getTextContent(child as Element);
  }
  return text;
}

function rehypeExtractMermaid() {
  return (tree: Root) => {
    const walk = (node: Root | Element) => {
      const children = node.children;
      for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (child.type !== "element") continue;

        if (child.tagName === "pre") {
          const code = child.children.find(
            (c): c is Element => c.type === "element" && c.tagName === "code",
          );
          if (!code) continue;
          const classes = code.properties?.className;
          if (!Array.isArray(classes)) continue;
          if (!classes.some((c) => typeof c === "string" && c.includes("mermaid"))) continue;

          const source = getTextContent(code);
          const replacement: ElementContent = {
            type: "element",
            tagName: "div",
            properties: { className: ["mermaid-source"] },
            children: [{ type: "text", value: source }],
          };
          children[i] = replacement;
          continue;
        }

        walk(child);
      }
    };
    walk(tree);
  };
}

let highlighter: HighlighterCore | null = null;

async function getHighlighter(): Promise<HighlighterCore> {
  if (highlighter) return highlighter;
  highlighter = await createHighlighterCore({
    themes: [
      import("shiki/themes/github-light.mjs"),
      import("shiki/themes/github-dark.mjs"),
    ],
    langs: [
      import("shiki/langs/javascript.mjs"),
      import("shiki/langs/typescript.mjs"),
      import("shiki/langs/python.mjs"),
      import("shiki/langs/rust.mjs"),
      import("shiki/langs/go.mjs"),
      import("shiki/langs/swift.mjs"),
      import("shiki/langs/json.mjs"),
      import("shiki/langs/yaml.mjs"),
      import("shiki/langs/bash.mjs"),
      import("shiki/langs/css.mjs"),
      import("shiki/langs/html.mjs"),
      import("shiki/langs/sql.mjs"),
      import("shiki/langs/markdown.mjs"),
      import("shiki/langs/jsx.mjs"),
      import("shiki/langs/tsx.mjs"),
      import("shiki/langs/toml.mjs"),
      import("shiki/langs/diff.mjs"),
    ],
    engine: createOnigurumaEngine(import("shiki/wasm")),
  });
  return highlighter;
}

let processorPromise: Promise<typeof processor> | null = null;

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype, { allowDangerousHtml: false })
  .use(rehypeSanitize, schema)
  .use(rehypeExtractMermaid)
  .use(rehypeSlug)
  .use(rehypeStringify);

async function getProcessor() {
  if (!processorPromise) {
    processorPromise = getHighlighter().then((hl) =>
      processor.use(rehypeShikiFromHighlighter, hl, {
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      }),
    );
  }
  return processorPromise;
}

export async function renderMarkdown(source: string): Promise<string> {
  const p = await getProcessor();
  const result = await p.process(source);
  return String(result);
}
