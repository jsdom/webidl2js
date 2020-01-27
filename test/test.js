"use strict";

const fs = require("fs");
const path = require("path");
const Transformer = require("..");

const rootDir = path.resolve(__dirname, "..");
const casesDir = path.resolve(__dirname, "cases");
const implsDir = path.resolve(__dirname, "implementations");
const outputDir = path.resolve(__dirname, "output");

const idlFiles = fs.readdirSync(casesDir);

describe("without processors", () => {
  beforeAll(() => {
    const transformer = new Transformer();
    transformer.addSource(casesDir, implsDir);

    return transformer.generate(outputDir);
  });

  for (const idlFile of idlFiles) {
    test(idlFile, () => {
      const outputFile = path.resolve(outputDir, path.basename(idlFile, ".webidl") + ".js");
      const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

      expect(output).toMatchSnapshot();
    });
  }
});

describe("with processors", () => {
  beforeAll(() => {
    const transformer = new Transformer({
      processCEReactions(code) {
        const ceReactions = this.addImport("../CEReactions");

        return `
          ${ceReactions}.preSteps(globalObject);
          try {
            ${code}
          } finally {
            ${ceReactions}.postSteps(globalObject);
          }
        `;
      },
      processHTMLConstructor() {
        const htmlConstructor = this.addImport("../HTMLConstructor", "HTMLConstructor");

        return `
          return ${htmlConstructor}(globalObject, interfaceName);
        `;
      }
    });
    transformer.addSource(casesDir, implsDir);

    return transformer.generate(outputDir);
  });

  for (const idlFile of idlFiles) {
    test(idlFile, () => {
      const outputFile = path.resolve(outputDir, path.basename(idlFile, ".webidl") + ".js");
      const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

      expect(output).toMatchSnapshot();
    });
  }
});

test("utils.js", () => {
  const input = fs.readFileSync(path.resolve(rootDir, "lib/output/utils.js"), { encoding: "utf-8" });
  const output = fs.readFileSync(path.resolve(outputDir, "utils.js"), { encoding: "utf-8" });
  expect(output).toBe(input);
});
