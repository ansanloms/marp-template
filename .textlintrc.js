// rules は --rules-base-directory (deno.json の textlint task が "$PWD/textlint" を渡す)
// 配下の、textlint の命名規則に従うディレクトリで解決する。
//   - "preset-ansanloms" -> textlint/textlint-rule-preset-ansanloms/index.js
// textlint のローダは Node の require で動き、URL や import map の specifier を直接は
// 解決できないため、index.js が import map (deno.json) 経由で jsDelivr 配信の実体を
// 再 export する薄いラッパーになっている。
//
// 制約:
//   - --rules-base-directory を渡すと resolver は base dir 配下しか探さない。rule・
//     filter・plugin を後から足すときも、同じ形のラッパーディレクトリを textlint/ に置く。
//   - ラッパーの解決に失敗しても textlint は "No rules found" としか出さない。原因は
//     `DEBUG='textlint:*' deno task textlint --debug <file>` で確認できる。
//   - preset-ansanloms の実体は deno.json の import map で jsDelivr のタグ付き URL に
//     固定している。同様に URL 固定の依存として @ansanloms/nord-marp-theme/ がある。
//     Dependabot の deno エコシステムは npm: / jsr: 指定しか更新しないため、これらの
//     バージョン更新は deno.json の URL を手で書き換え、deno.lock を更新する。
//
// 個別 rule の options は preset 側 (ansanloms/textlint-rule-preset-ansanloms の index.ts) が
// 持ち、ここでは上書きしない。上書きが必要な場合は該当ルールの options を丸ごと書き直す
// (textlint はユーザ設定側の options をマージではなく置換で適用する)。
module.exports = {
  rules: {
    "preset-ansanloms": true,
  },
};
