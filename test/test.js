"use strict";

const { describe, test, before, snapshot } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

snapshot.setDefaultSnapshotSerializers([value => value]);
const Transformer = require("..");
const reflector = require("./reflector");

const rootDir = path.resolve(__dirname, "..");
const casesDir = path.resolve(__dirname, "cases");
const implsDir = path.resolve(__dirname, "implementations");
const outputDir = path.resolve(__dirname, "output");
const snapshotsDir = path.resolve(__dirname, "snapshots");

const idlFiles = fs.readdirSync(casesDir);

function createLegacyPlatformObject(name, privateData) {
  const generated = require(path.resolve(outputDir, `${name}.js`));
  const utils = require(path.resolve(outputDir, "utils.js"));
  const context = vm.createContext();
  const globalObject = vm.runInContext("globalThis", context);
  generated.install(globalObject, ["Window"]);
  const wrapper = generated.create(globalObject, [], privateData);
  return { globalObject, implementation: utils.implForWrapper(wrapper), wrapper };
}

describe("generation", () => {
  describe("built-in types", () => {
    before(() => {
      const transformer = new Transformer();
      return transformer.generate(outputDir);
    });

    test("Function", t => {
      const outputFile = path.resolve(outputDir, "Function.js");
      const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

      t.assert.fileSnapshot(output, path.resolve(snapshotsDir, "built-in-types", "Function.js"));
    });

    test("VoidFunction", t => {
      const outputFile = path.resolve(outputDir, "VoidFunction.js");
      const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

      t.assert.fileSnapshot(output, path.resolve(snapshotsDir, "built-in-types", "VoidFunction.js"));
    });
  });

  describe("without processors", () => {
    before(() => {
      const transformer = new Transformer();
      transformer.addSource(casesDir, implsDir);

      return transformer.generate(outputDir);
    });

    for (const idlFile of idlFiles) {
      test(idlFile, t => {
        const basename = path.basename(idlFile, ".webidl");
        const outputFile = path.resolve(outputDir, `${basename}.js`);
        const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

        t.assert.fileSnapshot(output, path.resolve(snapshotsDir, "without-processors", `${basename}.js`));
      });
    }

    describe("legacy platform object property access", () => {
      test("indexed properties and ordinary fallbacks", () => {
        const { globalObject, wrapper } = createLegacyPlatformObject("URLList", { values: ["zero"] });

        assert.strictEqual(wrapper[0], "zero");
        assert.strictEqual(wrapper[1], undefined);

        Object.defineProperty(globalObject.URLList.prototype, "receiver", {
          configurable: true,
          get() {
            return this;
          }
        });
        const derived = Object.create(wrapper);
        assert.strictEqual(derived.receiver, derived);

        Object.defineProperty(wrapper, "ownAccessor", {
          configurable: true,
          get() {
            return this;
          }
        });
        assert.strictEqual(wrapper.ownAccessor, wrapper);

        const symbol = Symbol("test");
        wrapper[symbol] = "symbol value";
        assert.strictEqual(wrapper[symbol], "symbol value");

        Object.setPrototypeOf(wrapper, null);
        assert.strictEqual(wrapper.missing, undefined);
      });

      test("combined indexed and named properties", () => {
        const named = {
          1: "named numeric property",
          item: "named prototype property",
          person: "named property"
        };
        const { implementation, wrapper } = createLegacyPlatformObject("HTMLCollection", {
          indexed: ["indexed property"],
          named
        });

        implementation.indexedCalls.length = 0;
        implementation.namedCalls.length = 0;
        assert.strictEqual(wrapper[0], "indexed property");
        assert.deepStrictEqual(implementation.indexedCalls, [0]);
        assert.deepStrictEqual(implementation.namedCalls, []);

        assert.strictEqual(wrapper[1], undefined);
        assert.deepStrictEqual(implementation.indexedCalls, [0, 1]);
        assert.deepStrictEqual(implementation.namedCalls, []);

        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "1"), undefined);
        assert.deepStrictEqual(implementation.indexedCalls, [0, 1, 1]);
        assert.deepStrictEqual(implementation.namedCalls, []);

        assert.strictEqual(wrapper.person, "named property");
        assert.deepStrictEqual(implementation.namedCalls, ["person"]);
        assert.strictEqual(typeof wrapper.item, "function");

        const ownNamed = {};
        const { wrapper: wrapperWithOwnProperty } = createLegacyPlatformObject("HTMLCollection", { named: ownNamed });
        Object.defineProperty(wrapperWithOwnProperty, "person", {
          configurable: true,
          value: "own property"
        });
        ownNamed.person = "named property";
        assert.strictEqual(wrapperWithOwnProperty.person, "own property");
      });

      test("LegacyOverrideBuiltins named properties", () => {
        const entries = { inherited: "named property" };
        const { globalObject, wrapper } = createLegacyPlatformObject("LegacyOverrideBuiltins", { entries });
        Object.defineProperty(globalObject.LegacyOverrideBuiltins.prototype, "inherited", {
          configurable: true,
          value: "inherited property"
        });
        assert.strictEqual(wrapper.inherited, "named property");

        const ownEntries = {};
        const { wrapper: wrapperWithOwnProperty } = createLegacyPlatformObject("LegacyOverrideBuiltins", {
          entries: ownEntries
        });
        Object.defineProperty(wrapperWithOwnProperty, "own", {
          configurable: true,
          value: "own property"
        });
        ownEntries.own = "named property";
        assert.strictEqual(wrapperWithOwnProperty.own, "own property");
      });
    });

    describe("brand checks", () => {
      test("a no-op Proxy wrapping a wrapper does not pass the brand check", () => {
        const { wrapper } = createLegacyPlatformObject("BrandCheck", {});
        const proxy = new Proxy(wrapper, {});

        assert.throws(() => {
          proxy.value = "evil";
        }, /is not a valid instance of BrandCheck/);
        assert.throws(() => {
          return proxy.value;
        }, /is not a valid instance of BrandCheck/);
        assert.throws(() => {
          proxy.method();
        }, /is not a valid instance of BrandCheck/);

        // Direct (non-proxied) usage keeps working.
        wrapper.value = "fine";
        assert.strictEqual(wrapper.value, "fine");
        assert.strictEqual(wrapper.method(), "called");
      });
    });
  });

  describe("with processors", () => {
    before(() => {
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
            (reflectAttr && reflectAttr.rhs && reflectAttr.rhs.value.replace(/_/g, "-")) || idl.name.toLowerCase();
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
      test(idlFile, t => {
        const basename = path.basename(idlFile, ".webidl");
        const outputFile = path.resolve(outputDir, `${basename}.js`);
        const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

        t.assert.fileSnapshot(output, path.resolve(snapshotsDir, "with-processors", `${basename}.js`));
      });
    }
  });

  test("utils.js", () => {
    const input = fs.readFileSync(path.resolve(rootDir, "lib/output/utils.js"), { encoding: "utf-8" });
    const output = fs.readFileSync(path.resolve(outputDir, "utils.js"), { encoding: "utf-8" });
    assert.strictEqual(output, input);
  });
});
