import { defineConfig } from "@marp-team/marp-cli";
import { Marp } from "@marp-team/marp-core";
import * as path from "@std/path";
import { contentType } from "@std/media-types";
import { encodeBase64 } from "@std/encoding";
import { escape as escapeHtml } from "@std/html";
import Shiki from "@shikijs/markdown-it";
import {
  transformerMetaHighlight,
  transformerMetaWordHighlight,
  transformerNotationFocus,
} from "@shikijs/transformers";
import MarkdownItGitHubAlerts from "markdown-it-github-alerts";
// 出力 HTML 末尾に <script> として inline 注入するソースと nord-marp-theme の
// CSS をすべて text import で取り込む。実行可能な .mjs / .min.js も含めて
// `with { type: "text" }` を付けることで Deno が中身をパースせず文字列として
// 渡すため、Deno のモジュール解決とキャッシュに乗る。
//   - mermaid 公式 UMD bundle (dynamic chunk 込みの単一ファイル)。これにより
//     PNG/PDF 化を担う Chromium がブラウザ実 DOM 上で mermaid を render するため、
//     SSR (jsdom/svgdom) 由来のレイアウト計算ズレを根本回避できる
//   - ブラウザ側で mermaid を制御するスクリプト (Nord パレット / MermaidConfig /
//     sandbox 経由 render を内包)
import mermaidBundleSource from "mermaid/dist/mermaid.min.js" with {
  type: "text",
};
import mermaidScriptSource from "./assets/scripts/mermaid.mjs" with {
  type: "text",
};
import nordThemeSource from "nord-marp-theme/dist/nord.css" with {
  type: "text",
};

const __dirname = path.dirname(path.fromFileUrl(import.meta.url));

// nord-marp-theme は text import で読み込んだ文字列を themeSet 配下
// (dist/themes/nord.css) に書き出して Marp CLI が参照できるローカル
// ファイルにする。
const themesDir = path.join(__dirname, "dist/themes");
await Deno.mkdir(themesDir, { recursive: true });
await Deno.writeTextFile(path.join(themesDir, "nord.css"), nordThemeSource);

// custom.css を marp.config.mjs 自身の位置基準で絶対パス解決する。これにより
// 本ファイルを外部プロジェクトから import しても custom.css の位置が崩れない。
const customThemePath = path.fromFileUrl(
  import.meta.resolve("./assets/styles/custom.css"),
);

/**
 * Marpit の render() が返す結果。@marp-team/marpit の RenderResult をそのまま参照する。
 * @typedef {import("@marp-team/marpit").RenderResult} RenderResult
 */

/**
 * {@link Preprocess} が返すべき結果。書き換え後の Markdown と env をまとめて返す。
 * @typedef {object} PreprocessResult
 * @property {string} markdown - 書き換え後の Markdown
 * @property {any} env - 後続の処理に渡す env (Marpit の render が受ける env と同じ)
 */

/**
 * Marpit が render() する前に Markdown 文字列に手を入れるためのコールバック。
 * env も合わせて受け取り、書き換え後の Markdown と env を {@link PreprocessResult}
 * として返す。Promise を返してもよく、コードブロック単位の async 処理を
 * 仕込むのに使う。
 * @callback Preprocess
 * @param {string} markdown - 入力 Markdown
 * @param {any} env - Marpit に渡される env
 * @returns {Promise<PreprocessResult> | PreprocessResult}
 */

/**
 * Marpit が render() した後の html / css / comments を加工するためのコールバック。
 * 加工後の値を {@link RenderResult} として返す。Promise を返してもよい。
 * @callback Postprocess
 * @param {string} markdown - preprocess を通した後の Markdown
 * @param {any} env - 同じく preprocess 後の env
 * @param {RenderResult["html"]} html - Marpit が生成した HTML
 * @param {RenderResult["css"]} css - Marpit が生成した CSS
 * @param {RenderResult["comments"]} comments - Marpit が抽出したコメント
 * @returns {Promise<RenderResult> | RenderResult}
 */

/**
 * Marp を継承して、Marpit の render の前後に独自の async 処理を差し込めるよう
 * にした engine。preprocess / postprocess を任意個チェーンで登録でき、登録順に
 * 順次適用される。
 */
class PostprocessMarpitEngine extends Marp {
  /** @type {Preprocess[]} */
  preprocesses = [];

  /** @type {Postprocess[]} */
  postprocesses = [];

  /**
   * Preprocess を末尾に追加する。複数回呼ぶと登録順に連鎖適用される。
   * @param {Preprocess} preprocess
   * @returns {this}
   */
  withPreprocess(preprocess) {
    this.preprocesses.push(preprocess);
    return this;
  }

  /**
   * Postprocess を末尾に追加する。複数回呼ぶと登録順に連鎖適用される。
   * @param {Postprocess} postprocess
   * @returns {this}
   */
  withPostprocess(postprocess) {
    this.postprocesses.push(postprocess);
    return this;
  }

  /**
   * 登録された preprocess を順に適用してから super.render() で Marpit に
   * 委譲し、得られた結果を postprocess に順に通して最終的な
   * {@link RenderResult} を返す。
   * @param {string} markdown
   * @param {any} [env={}]
   * @returns {Promise<RenderResult>}
   */
  async render(markdown, env = {}) {
    let processed = { markdown, env };
    for (const fn of this.preprocesses) {
      processed = await fn(processed.markdown, processed.env);
    }

    /** @type {RenderResult} */
    let result = super.render(processed.markdown, processed.env);

    for (const fn of this.postprocesses) {
      result = await fn(
        processed.markdown,
        processed.env,
        result.html,
        result.css,
        result.comments,
      );
    }

    return result;
  }
}

export default defineConfig({
  themeSet: themesDir,
  theme: customThemePath,
  html: true,
  engine: async (options) =>
    new PostprocessMarpitEngine(options)
      .use(
        await Shiki({
          theme: "nord",
          langAlias: { quote: "markdown" },
          // @shikijs/transformers の組み込み transformer:
          //   - transformerMetaHighlight: ```ts {1,3-4} で行ハイライト
          //   - transformerMetaWordHighlight: ```ts /word/ で語ハイライト
          //   - transformerNotationFocus: // [!code focus] で行フォーカス
          // 装飾 (.highlighted / .highlighted-word / .focused / .has-focused) は
          // assets/styles/custom.css 側に閉じる。
          transformers: [
            transformerMetaHighlight(),
            transformerMetaWordHighlight(),
            transformerNotationFocus(),
          ],
        }),
      )
      .use((md) => {
        const defaultRender = md.renderer.rules.fence;

        md.renderer.rules.fence = (
          tokens,
          idx,
          options,
          env,
          renderer,
        ) => {
          const token = tokens[idx];
          const lang = token.info.trim();

          // mermaid は <div class="mermaid"> として出力する。HTML 末尾に
          // inline 注入される mermaid.run() がこの class を走査して SVG に
          // 置換する。<pre> ではなく <div> なのは、Marp テーマの pre 装飾
          // (背景色 / padding / 枠) が乗らないようにするため。
          if (lang === "mermaid") {
            return `<div class="mermaid">${escapeHtml(token.content)}</div>\n`;
          }

          // quote は中身を Markdown インラインとして再レンダリングし、
          // <div class="quote"> で wrap する。引用元クレジット用途 (右寄せ
          // 斜体・「―――」プレフィックス。assets/styles/custom.css の .quote)
          // を想定し、リンク・強調・インラインコードだけ生かす。renderInline
          // を使うのは、<p> を生成しないことで p::before の字下げ (全角スペース)
          // が .quote 内に入り込むのを防ぐため。
          if (lang === "quote") {
            return `<div class="quote">${
              md.renderInline(token.content, env)
            }</div>\n`;
          }

          // デフォルトの処理。
          return defaultRender(tokens, idx, options, env, renderer);
        };
      })
      .use((md) => {
        const defaultRender = md.renderer.rules.image;

        md.renderer.rules.image = (tokens, idx, options, env, renderer) => {
          const token = tokens[idx];
          const srcIndex = token.attrIndex("src");
          const src = token.attrs[srcIndex][1];

          const content = encodeBase64(Deno.readFileSync(
            path.resolve(path.join(__dirname, src)),
          ));
          const dataUri = `data:${
            contentType(path.extname(src))
          };base64,${content}`;

          token.attrs[srcIndex][1] = dataUri;

          return defaultRender(tokens, idx, options, env, renderer);
        };
      })
      .use(MarkdownItGitHubAlerts)
      .withPostprocess((_markdown, _env, html, css, comments) => ({
        // 2 つの <script> を HTML 末尾に inline 注入する:
        //   1. mermaid 本体 (UMD bundle、globalThis.mermaid を設定)
        //   2. assets/scripts/mermaid.mjs (Nord パレット / MermaidConfig /
        //      sandbox 経由 render を内包)
        // <pre class="mermaid"> の見た目は assets/styles/custom.css 側に閉じる。
        html: html + `
<script>${mermaidBundleSource}</script>
<script>${mermaidScriptSource}</script>`,
        css,
        comments,
      })),
});
