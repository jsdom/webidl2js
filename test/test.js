"use strict";

const fs = require("fs");
const path = require("path");
const Transformer = require("..");
const reflector = require("./reflector");

const rootDir = path.resolve(__dirname, "..");
const casesDir = path.resolve(__dirname, "cases");
const implsDir = path.resolve(__dirname, "implementations");
const outputDir = path.resolve(__dirname, "output");

const idlFiles = fs.readdirSync(casesDir);

describe("built-in types", () => {
  beforeAll(() => {
    const transformer = new Transformer();
    return transformer.generate(outputDir);
  });

  test("Function", () => {
    const outputFile = path.resolve(outputDir, "Function.js");
    const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

    expect(output).toMatchSnapshot();
  });

  test("VoidFunction", () => {
    const outputFile = path.resolve(outputDir, "VoidFunction.js");
    const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

    expect(output).toMatchSnapshot();
  });
});

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
      },
      processReflect(idl, implObj) {
        const reflectAttr = idl.extAttrs.find(attr => attr.name === "Reflect");
        const attrName =
          reflectAttr && reflectAttr.rhs && reflectAttr.rhs.value.replace(/_/g, "-") || idl.name.toLowerCase();
        if (idl.idlType.idlType === "USVString") {
          const reflectURL = idl.extAttrs.find(attr => attr.name === "ReflectURL");
          if (reflectURL) {
            const whatwgURL = this.addImport("whatwg-url");
            return {
              get: `
                const value = ${implObj}.getAttributeNS(null, "${attrName}");
                if (value === null) {
                  return "";
                }
                const urlRecord = ${whatwgURL}.parseURL(value, { baseURL: "http://localhost:8080/" });
                return urlRecord === null ? conversions.USVString(value) : ${whatwgURL}.serializeURL(urlRecord);
              `,
              set: `
                ${implObj}.setAttributeNS(null, "${attrName}", V);
              `
            };
          }
        }
        const reflect = reflector[idl.idlType.idlType];
        return {
          get: reflect.get(implObj, attrName),
          set: reflect.set(implObj, attrName)
        };
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

describe("with external imports", () => {
  beforeAll(() => {
    const transformer = new Transformer({
      importedTypes: {
        "Imported-DOMException": "domexception/webidl2js-wrapper",
        "Imported-URL": "whatwg-url/webidl2js-wrapper#URL",
        "Imported-URLSearchParams": "whatwg-url/webidl2js-wrapper#URLSearchParams"
      }
    });
    transformer.addSource(casesDir, implsDir);

    return transformer.generate(outputDir);
  });

  test("UsingExternal.webidl", () => {
    const outputFile = path.resolve(outputDir, "UsingExternal.js");
    const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

    expect(output).toMatchSnapshot();
  });
});

test("utils.js", () => {
  const input = fs.readFileSync(path.resolve(rootDir, "lib/output/utils.js"), { encoding: "utf-8" });
  const output = fs.readFileSync(path.resolve(outputDir, "utils.js"), { encoding: "utf-8" });
  expect(output).toBe(input);
});
