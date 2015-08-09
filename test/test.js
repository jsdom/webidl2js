const fs = require("fs");
const transformer = require("..");

transformer.generate(
  fs.readFileSync(__dirname + "/cases/URL.idl", { encoding: "utf-8" }),
  __dirname + "/output/",
  "../implementations/"
);