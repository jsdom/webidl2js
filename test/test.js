const fs = require("fs");
const Transformer = require("..");

const transformer = new Transformer()
  .addSource(__dirname + "/cases/URL.idl", __dirname + "/implementations/")
  .generate(__dirname + "/output/")
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
