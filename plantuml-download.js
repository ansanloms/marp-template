const plantuml = require("./src/plantuml");
const { version, dist, checksum } = require("./plantuml.config");

plantuml
  .download(version, dist, checksum)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
