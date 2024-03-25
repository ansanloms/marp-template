const path = require("path");
const plantuml = require("./plantuml");

const version = "v1.2024.3";
const checksum =
  "519a4a7284c6a0357c369e4bb0caf72c4bfbbde851b8c6d6bbdb7af3c01fc82f";
const dist = path.resolve(__dirname, "../bin/plantuml.jar");

plantuml
  .download(version, dist, checksum)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
