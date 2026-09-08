"use strict";

const { describe, test, before, beforeEach, snapshot } = require("node:test");
const { execFileSync } = require("node:child_process");
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

    describe("platform object brand checks", () => {
      let BrandCheck, BrandCheckParent, BrandCheckGrandchild, BrandCheckSibling, utils,
        globalObject, wrapper, impl;

      function install(global) {
        BrandCheckParent.install(global, ["Window"]);
        BrandCheck.install(global, ["Window"]);
        BrandCheckGrandchild.install(global, ["Window"]);
        BrandCheckSibling.install(global, ["Window"]);
      }

      beforeEach(() => {
        BrandCheck = require(path.resolve(outputDir, "BrandCheck.js"));
        BrandCheckParent = require(path.resolve(outputDir, "BrandCheckParent.js"));
        BrandCheckGrandchild = require(path.resolve(outputDir, "BrandCheckGrandchild.js"));
        BrandCheckSibling = require(path.resolve(outputDir, "BrandCheckSibling.js"));
        utils = require(path.resolve(outputDir, "utils.js"));
        globalObject = vm.runInNewContext("globalThis");
        install(globalObject);
        wrapper = new globalObject.BrandCheck();
        impl = utils.implForWrapper(wrapper);
      });

      test("uses IDL ancestry independently of implementation inheritance", () => {
        assert.strictEqual(BrandCheck.is(wrapper), true);
        assert.strictEqual(BrandCheckParent.is(wrapper), true);
        assert.strictEqual(BrandCheck.isImpl(impl), true);
        assert.strictEqual(BrandCheckParent.isImpl(impl), false);
        assert.strictEqual(BrandCheck.convert(globalObject, wrapper), impl);
        assert.strictEqual(BrandCheckParent.convert(globalObject, wrapper), impl);

        const parent = BrandCheckParent.create(globalObject);
        assert.strictEqual(BrandCheck.is(parent), false);

        const grandchild = new globalObject.BrandCheckGrandchild();
        assert.strictEqual(BrandCheckParent.is(grandchild), true);
        assert.strictEqual(BrandCheck.is(grandchild), true);
        assert.strictEqual(BrandCheckGrandchild.is(grandchild), true);
        assert.strictEqual(BrandCheckSibling.is(grandchild), false);
        assert.strictEqual(grandchild.parentMethod(), "parent:grandchild");
        assert.strictEqual(grandchild.childMethod(), "child:grandchild");
        assert.strictEqual(grandchild.grandchildMethod(), "grandchild:grandchild");

        const sibling = new globalObject.BrandCheckSibling();
        assert.strictEqual(BrandCheckParent.is(sibling), true);
        assert.strictEqual(BrandCheck.is(sibling), false);
        assert.strictEqual(BrandCheckGrandchild.is(sibling), false);
        assert.strictEqual(BrandCheckSibling.is(sibling), true);
        assert.strictEqual(sibling.siblingMethod(), "sibling:sibling");
      });

      test("unwraps receivers for operations, attributes, and stringifiers", () => {
        assert.strictEqual(wrapper.value, "initial");
        wrapper.value = "changed";
        assert.strictEqual(wrapper.parentMethod(), "parent:changed");
        assert.strictEqual(wrapper.childMethod(), "child:changed");
        assert.strictEqual(wrapper.toString(), "changed");
        assert.strictEqual(wrapper.shadow("argument"), "shadow:argument");
      });

      test("rejects proxies without invoking their traps", () => {
        let trapCalls = 0;
        function trap() {
          ++trapCalls;
          throw new Error("unexpected proxy trap");
        }
        const proxy = new Proxy(wrapper, { get: trap, getOwnPropertyDescriptor: trap, getPrototypeOf: trap });
        const parentPrototype = globalObject.BrandCheckParent.prototype;
        const valueDescriptor = Object.getOwnPropertyDescriptor(parentPrototype, "value");
        assert.strictEqual(BrandCheck.is(proxy), false);
        assert.strictEqual(BrandCheckParent.is(proxy), false);
        assert.throws(() => BrandCheck.convert(globalObject, proxy), globalObject.TypeError);
        assert.throws(() => wrapper.childMethod.call(proxy), globalObject.TypeError);
        assert.throws(() => parentPrototype.parentMethod.call(proxy), globalObject.TypeError);
        assert.throws(() => parentPrototype.toString.call(proxy), globalObject.TypeError);
        assert.throws(() => valueDescriptor.get.call(proxy), globalObject.TypeError);
        assert.throws(() => valueDescriptor.set.call(proxy, "proxy"), globalObject.TypeError);
        assert.strictEqual(trapCalls, 0);
        assert.strictEqual(wrapper.value, "initial");
      });

      test("rejects inherited or copied properties, transparent and revoked proxies, and primitives", () => {
        const revocable = Proxy.revocable(wrapper, {});
        revocable.revoke();
        const invalid = [
          Object.create(wrapper),
          Object.defineProperties({}, Object.getOwnPropertyDescriptors(wrapper)),
          { [utils.wrapperSymbol]: wrapper },
          new Proxy(wrapper, {}),
          revocable.proxy,
          undefined,
          null,
          true,
          0,
          1n,
          "",
          Symbol("value")
        ];
        const { childMethod } = wrapper;
        for (const value of invalid) {
          assert.strictEqual(BrandCheck.is(value), false);
          assert.throws(() => childMethod.call(value), globalObject.TypeError);
        }
      });

      test("preserves brands across realms and prototype changes", () => {
        const otherGlobalObject = vm.runInNewContext("globalThis");
        install(otherGlobalObject);
        const { parentMethod, toString } = otherGlobalObject.BrandCheckParent.prototype;
        const { childMethod } = otherGlobalObject.BrandCheck.prototype;
        assert.strictEqual(parentMethod.call(wrapper), "parent:initial");

        Object.setPrototypeOf(wrapper, null);
        assert.strictEqual(BrandCheck.is(wrapper), true);
        assert.strictEqual(BrandCheckParent.is(wrapper), true);
        assert.strictEqual(childMethod.call(wrapper), "child:initial");
        assert.strictEqual(parentMethod.call(wrapper), "parent:initial");
        assert.strictEqual(toString.call(wrapper), "initial");
      });

      test("registers setup(), new(), and createImpl() results before initialization", () => {
        assert.strictEqual(impl.wrapperSeenDuringInit, wrapper);
        const customWrapper = Object.create(globalObject.BrandCheck.prototype);
        assert.strictEqual(BrandCheck.setup(customWrapper, globalObject), customWrapper);
        assert.strictEqual(BrandCheck.is(customWrapper), true);
        assert.strictEqual(utils.wrapperForImpl(utils.implForWrapper(customWrapper)), customWrapper);

        for (const newImpl of [BrandCheck.new(globalObject), BrandCheck.createImpl(globalObject)]) {
          const newWrapper = utils.wrapperForImpl(newImpl);
          assert.strictEqual(BrandCheck.is(newWrapper), true);
          assert.strictEqual(BrandCheckParent.is(newWrapper), true);
          assert.strictEqual(newImpl.wrapperSeenDuringInit, newWrapper);
        }
      });

      test("unwraps wrappers but preserves other objects in object unions", () => {
        const plainObject = {};
        for (const value of [plainObject, new Proxy(wrapper, {})]) {
          wrapper.objectUnion(value);
          assert.strictEqual(impl.lastObjectUnionValue, value);
        }
        wrapper.objectUnion(wrapper);
        assert.strictEqual(impl.lastObjectUnionValue, impl);
      });
    });

    for (const entry of ["CircularParent", "CircularChild"]) {
      test(`circular inheritance imports with ${entry} loaded first`, () => {
        // Each subprocess has a fresh CommonJS cache, so both dependency orders are exercised.
        execFileSync(process.execPath, [
          "-e", `
          const assert = require("node:assert/strict");
          const vm = require("node:vm");
          require("./${entry}.js");
          const Parent = require("./CircularParent.js");
          const Child = require("./CircularChild.js");
          const utils = require("./utils.js");
          const globalObject = vm.runInNewContext("globalThis");
          Parent.install(globalObject, ["Window"]);
          Child.install(globalObject, ["Window"]);
          const parent = Parent.create(globalObject);
          const child = Child.create(globalObject);
          assert.equal(Parent.is(child), true);
          assert.equal(Child.is(child), true);
          assert.equal(Child.is(parent), false);
          parent.accept(child);
          assert.equal(utils.implForWrapper(parent).child, utils.implForWrapper(child));
        `
        ], { cwd: outputDir, stdio: "pipe" });
      });
    }

    describe("iterators retain implementations", () => {
      function createIterable(name, values) {
        const generated = require(path.resolve(outputDir, `${name}.js`));
        const utils = require(path.resolve(outputDir, "utils.js"));
        const globalObject = vm.runInNewContext("globalThis");
        generated.install(globalObject, ["Window"]);
        const wrapper = generated.create(globalObject, [], { values });
        return { globalObject, wrapper, impl: utils.implForWrapper(wrapper), utils };
      }

      test("pair iterators and forEach() expose wrappers and observe mutations", () => {
        const BrandCheck = require(path.resolve(outputDir, "BrandCheck.js"));
        const globalObject = vm.runInNewContext("globalThis");
        require(path.resolve(outputDir, "BrandCheckParent.js")).install(globalObject, ["Window"]);
        BrandCheck.install(globalObject, ["Window"]);
        const value = new globalObject.BrandCheck();
        const utils = require(path.resolve(outputDir, "utils.js"));
        const values = [["first", utils.implForWrapper(value)]];
        const { wrapper } = createIterable("BrandCheckIterable", values);
        const iterator = wrapper.entries();
        assert.deepStrictEqual(iterator.next().value, ["first", value]);
        values.push(["second", utils.implForWrapper(value)]);
        assert.deepStrictEqual(iterator.next().value, ["second", value]);
        assert.strictEqual(iterator.next().done, true);
        assert.deepStrictEqual([...wrapper.keys()], ["first", "second"]);
        assert.deepStrictEqual([...wrapper.values()], [value, value]);

        const calls = [];
        const thisArg = {};
        wrapper.forEach(function (entry, key, receiver) {
          assert.strictEqual(this, thisArg);
          assert.strictEqual(receiver, wrapper);
          calls.push([key, entry]);
          if (key === "second") {
            values.push(["third", utils.implForWrapper(value)]);
          }
        }, thisArg);
        assert.deepStrictEqual(calls, [["first", value], ["second", value], ["third", value]]);
      });

      for (const name of ["BrandCheckIterable", "BrandCheckAsyncIterable"]) {
        test(`${name} rejects invalid receivers`, () => {
          const { globalObject, wrapper } = createIterable(name, []);
          const revocable = Proxy.revocable(wrapper, {});
          revocable.revoke();
          for (const receiver of [{}, Object.create(wrapper), new Proxy(wrapper, {}), revocable.proxy]) {
            assert.throws(() => wrapper.entries.call(receiver), globalObject.TypeError);
          }
        });
      }

      test("async pair iterators convert arguments, wrap values, serialize next(), and run return steps", async () => {
        const { wrapper, impl, utils } = createIterable("BrandCheckAsyncIterable", [["skip", {}]]);
        const BrandCheck = require(path.resolve(outputDir, "BrandCheck.js"));
        const globalObject = vm.runInNewContext("globalThis");
        require(path.resolve(outputDir, "BrandCheckParent.js")).install(globalObject, ["Window"]);
        BrandCheck.install(globalObject, ["Window"]);
        const value = new globalObject.BrandCheck();
        impl.values.push(["first", utils.implForWrapper(value)], ["second", utils.implForWrapper(value)]);
        const iterator = wrapper.entries("1");
        assert.strictEqual(impl.offset, 1);
        const [first, second, returned] = await Promise.all([iterator.next(), iterator.next(), iterator.return("end")]);
        assert.deepStrictEqual(first.value, ["first", value]);
        assert.deepStrictEqual(second.value, ["second", value]);
        assert.strictEqual(returned.done, true);
        assert.strictEqual(returned.value, "end");
        assert.deepStrictEqual(impl.calls, ["next", "next", "return"]);
        assert.strictEqual(impl.returnValue, "end");
        assert.strictEqual((await iterator.next()).done, true);
        assert.strictEqual((await iterator.return("again")).value, "again");
        assert.deepStrictEqual(impl.calls, ["next", "next", "return"]);

        const keys = wrapper.keys(1);
        assert.strictEqual((await keys.next()).value, "first");
        const entries = [];
        for await (const item of wrapper.values(1)) {
          entries.push(item);
        }
        assert.deepStrictEqual(entries, [value, value]);
      });

      test("async value iterators unwrap their stored implementation and finish at end of iteration", async () => {
        const { wrapper, impl } = createIterable("BrandCheckAsyncValueIterable", ["first", "second"]);
        const values = [];
        for await (const value of wrapper) {
          values.push(value);
        }
        assert.deepStrictEqual(values, ["first", "second"]);
        assert.deepStrictEqual(impl.calls, ["next", "next", "next"]);
      });
    });

    describe("legacy platform object property access", () => {
      test("brands the final proxy but leaves its backing target unbranded", () => {
        const URLList = require(path.resolve(outputDir, "URLList.js"));
        const utils = require(path.resolve(outputDir, "utils.js"));
        const globalObject = vm.runInNewContext("globalThis");
        URLList.install(globalObject, ["Window"]);
        const target = Object.create(globalObject.URLList.prototype);
        const wrapper = URLList.setup(target, globalObject, [], { values: ["zero"] });
        const impl = utils.implForWrapper(wrapper);
        assert.notStrictEqual(wrapper, target);
        assert.strictEqual(utils.implForWrapper(target), impl);
        assert.strictEqual(impl.wrapperSeenDuringInit, wrapper);
        assert.strictEqual(URLList.is(wrapper), true);
        for (const receiver of [target, Object.create(wrapper), new Proxy(wrapper, {})]) {
          assert.strictEqual(URLList.is(receiver), false);
          assert.throws(() => wrapper.item.call(receiver, 0), globalObject.TypeError);
        }
        assert.strictEqual(wrapper[0], "zero");
      });

      test("borrowed methods accept wrappers from another realm and reject invalid receivers", () => {
        const first = createLegacyPlatformObject("HTMLCollection", {});
        const indexed = ["first"];
        const second = createLegacyPlatformObject("HTMLCollection", { indexed });
        const { item } = first.globalObject.HTMLCollection.prototype;

        assert.strictEqual(item.call(second.wrapper, 0), "first");
        indexed.push("second");
        assert.strictEqual(second.wrapper.length, 2);
        assert.strictEqual(item.call(second.wrapper, 1), "second");

        for (const receiver of [null, {}, Object.create(second.wrapper)]) {
          assert.throws(() => item.call(receiver, 0), /not a valid instance of HTMLCollection/);
        }
      });

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
