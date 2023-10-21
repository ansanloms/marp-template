const path = require("path");
const fs = require("fs");

const Prism = require("prismjs");
const loadLanguages = require("prismjs/components/");

const mime = require("mime-types");

const plantuml = {
  ...require("./src/plantuml"),
  options: {
    dist: path.resolve(__dirname, "./bin/plantuml.jar"),
    config: path.resolve(__dirname, "./plantuml-config.puml"),
  },
};

loadLanguages(["jsx", "php"]);

module.exports = {
  html: true,

  themeSet: path.join(__dirname, "/node_modules/nord-marp-theme/dist"),
  theme: path.join(__dirname, "/assets/styles/custom.css"),

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
      .use(require("markdown-it-container"), "note", {
        render: (tokens, idx) =>
          tokens[idx].nesting === 1
            ? `<div class="note ${tokens[idx].info
                .trim()
                .slice("note".length + 1)}">`
            : `</div>`,
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
      .use((md) => {
        const defaultRender =
          md.renderer.rules.marpit_advanced_background_image_open;

        md.renderer.rules.marpit_advanced_background_image_open = (
          tokens,
          idx,
          options,
          env,
          self,
        ) => {
          const token = tokens[idx];
          const styleIndex = token.attrIndex("style");
          const style = token.attrs[styleIndex][1];

          token.attrs[styleIndex][1] = style.replace(
            /background-image:url\("(.*)"\);/g,
            (match, src) => {
              const content = fs.readFileSync(path.join(__dirname, src));
              const dataUri = `data:${mime.lookup(
                src,
              )};base64,${content.toString("base64")}`;

              return `background-image:url("${dataUri}");`;
            },
          );

          return defaultRender(tokens, idx, options, env, self);
        };
      });

    return marp;
  },
};
