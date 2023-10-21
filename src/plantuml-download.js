const path = require("path");
const plantuml = require("./plantuml");

const version = "v1.2023.6";
const checksum =
  "bf2dee10750fd1794ad9eac7de020064d113838ec169448a16b639dbfb67617d";
const dist = path.resolve(__dirname, "../bin/plantuml.jar");

plantuml
  .download(version, dist, checksum)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
