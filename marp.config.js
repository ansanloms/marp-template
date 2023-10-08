const path = require("path");
const fs = require("fs");

const Prism = require("prismjs");
const loadLanguages = require("prismjs/components/");

const mime = require("mime-types");

const plantuml = {
  ...require("./src/plantuml"),
  options: require("./plantuml.config"),
};

loadLanguages(["jsx", "php"]);

module.exports = {
  html: true,

  themeSet: path.join(__dirname, "/node_modules/nord-marp-theme/dist"),
  theme: path.join(__dirname, "/assets/styles/main.css"),

  engine: ({ marp }) => {
    marp.highlighter = (code, lang) => {
      return Prism.highlight(code, Prism.languages[lang], lang);
    };

    marp
      .use((md) => {
        const defaultRender = md.renderer.rules.fence;

        md.renderer.rules.fence = (tokens, idx, options, env, self) => {
          return tokens[idx].info === "plantuml"
            ? [
                `<div class="uml">`,
                plantuml.umlToSvg(
                  tokens[idx].content,
                  plantuml.options.dist,
                  plantuml.options.config,
                ),
                `</div>`,
              ].join("\n")
            : defaultRender(tokens, idx, options, env, self);
        };
      })
      .use((md) => {
        const defaultRender = md.renderer.rules.image;

        md.renderer.rules.image = (tokens, idx, options, env, self) => {
          const token = tokens[idx];
          const srcIndex = token.attrIndex("src");
          const src = token.attrs[srcIndex][1];

          const content = fs.readFileSync(path.join(__dirname, src));
          const dataUri = `data:${mime.lookup(src)};base64,${content.toString(
            "base64",
          )}`;

          token.attrs[srcIndex][1] = dataUri;

          return defaultRender(tokens, idx, options, env, self);
        };
      })
      .use(require("markdown-it-container"), "note", {
        render: (tokens, idx) =>
          tokens[idx].nesting === 1
            ? `<div class="note ${tokens[idx].info
                .trim()
                .slice("note".length + 1)}">`
            : `</div>`,
      });

    return marp;
  },
};
