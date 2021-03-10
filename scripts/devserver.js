const chokidar = require("chokidar");
const childProcess = require("child_process");
const express = require("express");
const path = require("path");

const CODELAB_NAME = "firebase-emulator";
const PORT = 3000;

const SRC_PATH = path.resolve(__dirname, "../steps");
const LAB_PATH = path.join(SRC_PATH, "index.lab.md");
const DST_PATH = path.join(SRC_PATH, CODELAB_NAME);

function main() {
  const app = express();
  app.use(express.static(DST_PATH));

  console.log(`Serving content from ${DST_PATH} at http://localhost:${PORT}`);

  chokidar.watch(LAB_PATH).on("all", (event, path) => {
    console.log(`Detected file change (${path}), recompiling...`);
    childProcess.exec(`claat export index.lab.md`, {
      cwd: SRC_PATH,
    });
  });

  app.listen(PORT);
}

main();
