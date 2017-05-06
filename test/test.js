"use strict";

const fs = require("fs");
const path = require("path");
const Transformer = require("..");

const casesDir = path.resolve(__dirname, "cases");
const implsDir = path.resolve(__dirname, "implementations");
const outputDir = path.resolve(__dirname, "output");

beforeAll(() => {
  const transformer = new Transformer();
  transformer.addSource(casesDir, implsDir);

  return transformer.generate(outputDir);
});

const idlFiles = fs.readdirSync(casesDir);

for (const idlFile of idlFiles) {
  test(idlFile, () => {
    const outputFile = path.resolve(outputDir, path.basename(idlFile, ".idl") + ".js");
    const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

    expect(output).toMatchSnapshot();
  });
}
