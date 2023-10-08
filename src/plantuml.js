const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const process = require("child_process");

const download = async (version, dist, hash) => {
  const url = `https://github.com/plantuml/plantuml/releases/download/${version}/plantuml.jar`;

  if (
    fs.existsSync(dist) &&
    hash &&
    (await checksum(fs.readFileSync(dist), hash))
  ) {
    return;
  }

  console.log(`Downloading ${url}...`);

  if (!fs.existsSync(path.dirname(dist))) {
    fs.mkdirSync(path.dirname(dist));
  }

  const blob = await (await fetch(url)).blob();
  const content = new Uint8Array(await blob.arrayBuffer());
  fs.writeFileSync(dist, content);

  if (hash && !(await checksum(fs.readFileSync(dist), hash))) {
    throw new Error("plantuml.jar: checksum mismatch.");
  }
};

const sha256 = async (buf) => {
  return Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", buf)))
    .map((c) => c.toString(16).padStart(2, "0"))
    .join("");
};

const checksum = async (buf, hash) => {
  return (await sha256(buf)) === hash;
};

const umlToSvg = (uml, jar, config) => {
  return process
    .execSync(
      [
        `java -jar "${jar}"`,
        `-tsvg`,
        `-charset UTF-8`,
        config ? `-config "${config}"` : "",
        `-pipe`,
      ].join(" "),
      { input: uml },
    )
    .toString();
};

module.exports = { download, umlToSvg };
