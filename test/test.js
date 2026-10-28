"use strict";

const { describe, test, before, beforeEach, snapshot } = require("node:test");
const { execFileSync } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

snapshot.setDefaultSnapshotSerializers([(value) => value]);
const Transformer = require("..");
const reflector = require("./reflector");

const rootDir = path.resolve(__dirname, "..");
const casesDir = path.resolve(__dirname, "cases");
const implsDir = path.resolve(__dirname, "implementations");
const outputDir = path.resolve(__dirname, "output");
const snapshotsDir = path.resolve(__dirname, "snapshots");

const idlFiles = fs.readdirSync(casesDir);

function createLegacyPlatformObject(name, privateData, ancestors = []) {
  const generated = require(path.resolve(outputDir, `${name}.js`));
  const utils = require(path.resolve(outputDir, "utils.js"));
  const context = vm.createContext();
  const globalObject = vm.runInContext("globalThis", context);
  for (const interfaceName of [...ancestors, name]) {
    require(path.resolve(outputDir, `${interfaceName}.js`)).install(globalObject, ["Window"]);
  }
  const wrapper = generated.create(globalObject, [], privateData);
  return { globalObject, implementation: utils.implForWrapper(wrapper), wrapper };
}

describe("generation", () => {
  describe("built-in types", () => {
    before(() => {
      const transformer = new Transformer();
      return transformer.generate(outputDir);
    });

    test("Function", (t) => {
      const outputFile = path.resolve(outputDir, "Function.js");
      const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

      t.assert.fileSnapshot(output, path.resolve(snapshotsDir, "built-in-types", "Function.js"));
    });

    test("VoidFunction", (t) => {
      const outputFile = path.resolve(outputDir, "VoidFunction.js");
      const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

      t.assert.fileSnapshot(
        output,
        path.resolve(snapshotsDir, "built-in-types", "VoidFunction.js"),
      );
    });
  });

  describe("without processors", () => {
    before(() => {
      const transformer = new Transformer();
      transformer.addSource(casesDir, implsDir);

      return transformer.generate(outputDir);
    });

    for (const idlFile of idlFiles) {
      test(idlFile, (t) => {
        const basename = path.basename(idlFile, ".webidl");
        const outputFile = path.resolve(outputDir, `${basename}.js`);
        const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

        t.assert.fileSnapshot(
          output,
          path.resolve(snapshotsDir, "without-processors", `${basename}.js`),
        );
      });
    }

    test("lenient-only interfaces ignore invalid receivers before converting setter values", () => {
      const generated = require(path.resolve(outputDir, "LegacyLenientThisOnly.js"));
      const globalObject = vm.runInNewContext("globalThis");
      generated.install(globalObject, ["Window"]);
      const wrapper = generated.create(globalObject);
      const { get, set } = Object.getOwnPropertyDescriptor(
        globalObject.LegacyLenientThisOnly.prototype,
        "value",
      );

      assert.strictEqual(get.call(wrapper), "initial");
      set.call(wrapper, 42);
      assert.strictEqual(get.call(wrapper), "42");

      for (const receiver of [undefined, null, {}, new Proxy(wrapper, {})]) {
        assert.strictEqual(get.call(receiver), undefined);
        assert.strictEqual(set.call(receiver, Symbol("not convertible")), undefined);
      }
      assert.strictEqual(get.call(wrapper), "42");
    });

    describe("observable arrays", () => {
      let generated, utils, globalObject, wrapper, impl;

      beforeEach(() => {
        generated = require(path.resolve(outputDir, "ObservableArrays.js"));
        utils = require(path.resolve(outputDir, "utils.js"));
        globalObject = vm.runInNewContext("globalThis");
        generated.install(globalObject, ["Window"]);
        wrapper = new globalObject.ObservableArrays();
        impl = utils.implForWrapper(wrapper);
      });

      test("uses stable, attribute-specific symbols", () => {
        assert.strictEqual(utils.observableArraySet("names"), utils.observableArraySet("names"));
        assert.strictEqual(
          utils.observableArrayDelete("names"),
          utils.observableArrayDelete("names"),
        );
        assert.notStrictEqual(
          utils.observableArraySet("names"),
          utils.observableArraySet("employees"),
        );
        assert.notStrictEqual(
          utils.observableArraySet("names"),
          utils.observableArrayDelete("names"),
        );
      });

      test("preserves the proxy and backing list across assignment and self-assignment", () => {
        const array = wrapper.names;
        const list = impl.names;
        wrapper.names = [1, "two"];
        assert.strictEqual(wrapper.names, array);
        assert.strictEqual(impl.names, list);
        assert.deepStrictEqual([...array], ["1", "two"]);
        assert.deepStrictEqual(list, ["1", "two"]);
        wrapper.names = array;
        assert.strictEqual(wrapper.names, array);
        assert.deepStrictEqual(list, ["1", "two"]);
        assert.notStrictEqual(new globalObject.ObservableArrays().names, array);
      });

      test("reflects implementation mutations without conversion or hooks", () => {
        const array = wrapper.names;
        impl.names.push("one", "two");
        assert.deepStrictEqual([...array], ["one", "two"]);
        impl.names.splice(0, 1, "three");
        assert.deepStrictEqual([...array], ["three", "two"]);
        impl.names.length = 0;
        assert.strictEqual(array.length, 0);
        assert.deepStrictEqual(impl.events, []);
      });

      test("converts elements and runs hooks before changing the list", () => {
        wrapper.names.push(1);
        wrapper.names[0] = 2;
        wrapper.names.push("three");
        wrapper.names.length = 0;
        assert.deepStrictEqual(impl.events, [
          ["set", "1", 0, []],
          ["delete", "1", 0, ["1"]],
          ["set", "2", 0, ["1"]],
          ["set", "three", 1, ["2"]],
          ["delete", "three", 1, ["2", "three"]],
          ["delete", "2", 0, ["2"]],
        ]);
      });

      test("converts the complete assignment before running hooks or changing the list", () => {
        impl.names.push("original");
        const marker = new Error("conversion failed");
        assert.throws(
          () => {
            wrapper.names = [
              "first",
              {
                toString() {
                  throw marker;
                },
              },
            ];
          },
          (error) => error === marker,
        );
        assert.deepStrictEqual(impl.names, ["original"]);
        assert.deepStrictEqual(impl.events, []);

        let conversions = 0;
        wrapper.names = [
          {
            toString() {
              ++conversions;
              return "new";
            },
          },
        ];
        assert.strictEqual(conversions, 1);
        assert.deepStrictEqual(impl.events, [
          ["delete", "original", 0, ["original"]],
          ["set", "new", 0, []],
        ]);
        const instance = wrapper;
        for (const value of [null, undefined, "string", 1, {}]) {
          assert.throws(
            () => {
              instance.names = value;
            },
            { name: "TypeError" },
          );
          assert.deepStrictEqual(impl.names, ["new"]);
        }
      });

      test("preserves partial changes when hooks throw", () => {
        const marker = new Error("hook failed");
        impl.names.push("one", "two", "three");
        impl.onDelete = (value, index) => {
          if (index === 1) {
            throw marker;
          }
        };
        assert.throws(
          () => {
            wrapper.names.length = 0;
          },
          (error) => error === marker,
        );
        assert.deepStrictEqual(impl.names, ["one", "two"]);

        impl.onDelete = undefined;
        impl.onSet = (value) => {
          if (value === "bad") {
            throw marker;
          }
        };
        assert.throws(
          () => {
            wrapper.names = ["good", "bad", "later"];
          },
          (error) => error === marker,
        );
        assert.deepStrictEqual(impl.names, ["good"]);
        impl.events.length = 0;
        assert.throws(
          () => {
            wrapper.names[0] = "bad";
          },
          (error) => error === marker,
        );
        assert.deepStrictEqual(impl.names, ["good"]);
        assert.deepStrictEqual(impl.events, [
          ["delete", "good", 0, ["good"]],
          ["set", "bad", 0, ["good"]],
        ]);
      });

      test("stores impls and exposes wrappers, including property descriptors", () => {
        const employee = new globalObject.ObservableArrays();
        const employeeImpl = utils.implForWrapper(employee);
        wrapper.employees.push(employee, null);
        assert.deepStrictEqual(impl.employees, [employeeImpl, null]);
        assert.deepStrictEqual([...wrapper.employees], [employee, null]);
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper.employees, "0").value, employee);
        assert.deepStrictEqual(impl.events, [
          ["employee set", employeeImpl, 0],
          ["employee set", null, 1],
        ]);

        wrapper.employees = [employee];
        assert.deepStrictEqual(impl.employees, [employeeImpl]);
        assert.strictEqual(wrapper.employees.pop(), employee);
        assert.deepStrictEqual(impl.events.at(-1), ["employee delete", employeeImpl, 0]);
        assert.throws(() => wrapper.employees.push({}), globalObject.TypeError);
        assert.deepStrictEqual(impl.employees, []);
      });

      test("round-trips callback elements without converting them twice", () => {
        let calls = 0;
        function callback() {
          ++calls;
        }
        wrapper.callbacks = [callback];
        assert.strictEqual(wrapper.callbacks[0], callback);
        impl.callbacks[0]();
        assert.strictEqual(calls, 1);
        wrapper.callbacks.push(callback);
        assert.strictEqual(wrapper.callbacks[1], callback);
      });

      test("supports readonly attributes and omitted hooks", () => {
        const array = wrapper.readonlyNames;
        array.push(42);
        assert.deepStrictEqual(impl.readonlyNames, ["42"]);
        assert.throws(() => {
          wrapper.readonlyNames = [];
        }, TypeError);
        assert.strictEqual(wrapper.readonlyNames, array);
        assert.deepStrictEqual(impl.events, []);
        wrapper.numbers = [1.9, 2 ** 32 + 2];
        assert.deepStrictEqual(impl.numbers, [1, 2]);
      });

      test("supports frozen array elements", () => {
        wrapper.groups = [[1, "two"]];
        wrapper.groups.push(new Set([3]));
        assert.deepStrictEqual(wrapper.groups[0], ["1", "two"]);
        assert.deepStrictEqual(wrapper.groups[1], ["3"]);
        assert(Object.isFrozen(wrapper.groups[0]));
        assert.strictEqual(wrapper.groups[0], impl.groups[0]);
      });

      test("supports native array methods and array identity checks", () => {
        const array = wrapper.names;
        assert(Array.isArray(array));
        assert(array instanceof globalObject.Array);
        assert.strictEqual(array.constructor, globalObject.Array);
        array.push("b", "c");
        array.unshift("a");
        assert.strictEqual(array.shift(), "a");
        assert.deepStrictEqual([...array.splice(0, 1, "x", "y")], ["b"]);
        array.reverse();
        assert.deepStrictEqual([...array], ["c", "y", "x"]);
        assert.deepStrictEqual([...array.map((value) => value.toUpperCase())], ["C", "Y", "X"]);
        assert.deepStrictEqual([].concat(array), ["c", "y", "x"]);
        assert.strictEqual(JSON.stringify(array), '["c","y","x"]');
      });

      test("rejects holes, length growth, and deleting anything except the last index", () => {
        const array = wrapper.names;
        assert.strictEqual(Reflect.set(array, "1", Symbol("not converted")), false);
        assert.strictEqual(Reflect.set(array, "length", 1), false);
        array.push("one", "two");
        assert.strictEqual(Reflect.deleteProperty(array, "0"), false);
        assert.strictEqual(Reflect.deleteProperty(array, "2"), false);
        assert.strictEqual(Reflect.deleteProperty(array, "length"), false);
        assert.strictEqual(Reflect.deleteProperty(array, "1"), true);
        assert.deepStrictEqual([...array], ["one"]);
        assert.strictEqual(Reflect.set(array, "length", 0), true);
      });

      test("validates length and coerces it twice", () => {
        const array = wrapper.names;
        for (const value of [-1, 0.5, NaN, Infinity, 2 ** 32]) {
          assert.throws(() => {
            array.length = value;
          }, globalObject.RangeError);
        }
        for (const value of [1n, Symbol("length")]) {
          assert.throws(() => {
            array.length = value;
          }, globalObject.TypeError);
        }
        let calls = 0;
        wrapper.names.push("one");
        wrapper.names.length = {
          valueOf() {
            ++calls;
            return 0;
          },
        };
        assert.strictEqual(calls, 2);
        assert.deepStrictEqual(impl.names, []);
      });

      test("exposes virtual descriptors and keys while preserving ordinary properties", () => {
        const array = wrapper.names;
        impl.names.push("one", "two");
        const symbol = Symbol("extra");
        array.extra = 1;
        array["01"] = "ordinary";
        array[2 ** 32 - 1] = "also ordinary";
        array[symbol] = 2;
        assert.deepStrictEqual(Reflect.ownKeys(array), [
          "0",
          "1",
          "length",
          "extra",
          "01",
          "4294967295",
          symbol,
        ]);
        assert.deepStrictEqual(Object.getOwnPropertyDescriptor(array, "length"), {
          value: 2,
          writable: true,
          enumerable: false,
          configurable: false,
        });
        assert.deepStrictEqual(Object.getOwnPropertyDescriptor(array, "0"), {
          value: "one",
          writable: true,
          enumerable: true,
          configurable: true,
        });
        assert.strictEqual(Object.getOwnPropertyDescriptor(array, "2"), undefined);
        assert.strictEqual("1" in array, true);
        assert.strictEqual("2" in array, false);
        assert.strictEqual("length" in array, true);
        assert.strictEqual("extra" in array, true);
        assert.strictEqual(array[symbol], 2);
        assert.strictEqual(Reflect.deleteProperty(array, "extra"), true);
        assert.strictEqual("extra" in array, false);

        const receiver = {};
        Reflect.set(array, "other", 3, receiver);
        assert.strictEqual(receiver.other, 3);
        assert.strictEqual(array.other, undefined);
        Reflect.set(array, "0", "changed", receiver);
        assert.strictEqual(array[0], "changed");
        assert.strictEqual(receiver[0], undefined);
      });

      test("restricts indexed and length descriptors and remains extensible", () => {
        const array = wrapper.names;
        array.push("original");
        for (const descriptor of [
          { get() {} },
          { set() {} },
          { writable: false },
          { enumerable: false },
          { configurable: false },
        ]) {
          assert.strictEqual(Reflect.defineProperty(array, "0", descriptor), false);
        }
        for (const descriptor of [
          { get() {} },
          { writable: false },
          { enumerable: true },
          { configurable: true },
        ]) {
          assert.strictEqual(Reflect.defineProperty(array, "length", descriptor), false);
        }
        assert.strictEqual(Reflect.defineProperty(array, "0", { value: 42 }), true);
        assert.strictEqual(array[0], "42");
        const events = impl.events.length;
        assert.strictEqual(Reflect.defineProperty(array, "0", {}), true);
        assert.strictEqual(impl.events.length, events);
        assert.strictEqual(Reflect.defineProperty(array, "length", { value: 0 }), true);
        assert.strictEqual(array.length, 0);
        assert.strictEqual(Reflect.preventExtensions(array), false);
        for (const operation of [Object.preventExtensions, Object.seal, Object.freeze]) {
          assert.throws(() => operation(array), TypeError);
        }
        assert(Object.isExtensible(array));
      });

      test("keeps the owning realm when accessors are borrowed", () => {
        const otherGlobal = vm.runInNewContext("globalThis");
        generated.install(otherGlobal, ["Window"]);
        const other = generated.create(otherGlobal);
        const { get, set } = Object.getOwnPropertyDescriptor(
          globalObject.ObservableArrays.prototype,
          "names",
        );
        const array = get.call(other);
        assert.strictEqual(Object.getPrototypeOf(array), otherGlobal.Array.prototype);
        assert.strictEqual(array, other.names);
        set.call(other, [42]);
        assert.deepStrictEqual([...array], ["42"]);
        assert.throws(() => array.push(Symbol("invalid")), otherGlobal.TypeError);
        for (const receiver of [{}, new Proxy(wrapper, {}), Object.create(wrapper)]) {
          assert.throws(() => get.call(receiver), globalObject.TypeError);
          assert.throws(() => set.call(receiver, []), globalObject.TypeError);
        }
      });

      test("uses the captured array prototype after the global constructor changes", () => {
        const arrayPrototype = globalObject.Array.prototype;
        globalObject.Array = function Array() {
          throw new Error("unexpected constructor call");
        };
        const instance = generated.create(globalObject);
        assert(Array.isArray(instance.names));
        assert.strictEqual(Object.getPrototypeOf(instance.names), arrayPrototype);
        instance.names.push("one");
        assert.deepStrictEqual([...instance.names], ["one"]);
      });

      test("ignores inherited indexed properties outside the backing list", () => {
        const array = wrapper.names;
        const prototype = Object.create(globalObject.Array.prototype);
        prototype[0] = "inherited";
        Object.setPrototypeOf(array, prototype);
        assert.strictEqual(array[0], undefined);
        assert.strictEqual("0" in array, false);
        assert.strictEqual(Object.getOwnPropertyDescriptor(array, "0"), undefined);
        impl.names.push("own");
        assert.strictEqual(array[0], "own");
        assert.strictEqual("0" in array, true);
      });

      test("supports inherited and mixed-in attributes through every creation path", () => {
        const child = require(path.resolve(outputDir, "ObservableArraysChild.js"));
        child.install(globalObject, ["Window"]);
        for (const module of [generated, child]) {
          const createdImpl = module.new(globalObject);
          assert.strictEqual(createdImpl.names, undefined);
          Object.assign(createdImpl, {
            names: [],
            readonlyNames: [],
            employees: [],
            callbacks: [],
            groups: [],
            numbers: [],
            events: [],
          });
          const instances = [
            module.create(globalObject),
            utils.wrapperForImpl(module.createImpl(globalObject)),
            utils.wrapperForImpl(createdImpl),
            module.setup(
              Object.create(
                globalObject[module === child ? "ObservableArraysChild" : "ObservableArrays"]
                  .prototype,
              ),
              globalObject,
            ),
          ];
          for (const instance of instances) {
            instance.names.push("one");
            instance.numbers.push(2.5);
            const implementation = utils.implForWrapper(instance);
            assert.deepStrictEqual(implementation.names, ["one"]);
            assert.deepStrictEqual(implementation.numbers, [2]);
            assert.strictEqual(Object.getPrototypeOf(instance.names), globalObject.Array.prototype);
          }
        }
      });
    });

    describe("invalid observable array declarations", () => {
      const declarations = [
        ["static attributes", "static attribute ObservableArray<DOMString> names;"],
        ["nullable arrays", "attribute ObservableArray<DOMString>? names;"],
        ["dictionary elements", "attribute ObservableArray<EmployeeRecord> names;"],
        ["sequence elements", "attribute ObservableArray<sequence<DOMString>> names;"],
        ["record elements", "attribute ObservableArray<record<DOMString, long>> names;"],
        [
          "observable array elements",
          "attribute ObservableArray<ObservableArray<DOMString>> names;",
        ],
        ["return values", "ObservableArray<DOMString> names();"],
        ["arguments", "undefined names(ObservableArray<DOMString> values);"],
        ["nested arrays", "attribute sequence<ObservableArray<DOMString>> names;"],
        ["unions", "attribute (ObservableArray<DOMString> or DOMString) names;"],
        ["typedef arguments", "undefined names(Names values);"],
        ["typedef dictionary elements", "attribute ObservableArray<RecordAlias> names;"],
      ];

      for (const [name, member] of declarations) {
        test(name, async () => {
          const directory = fs.mkdtempSync(path.join(outputDir, "invalid-observable-array-"));
          try {
            const idlPath = path.join(directory, "Invalid.webidl");
            fs.writeFileSync(
              idlPath,
              `
              dictionary EmployeeRecord {};
              typedef EmployeeRecord RecordAlias;
              typedef ObservableArray<DOMString> Names;
              [Exposed=Window] interface Invalid { ${member} };
            `,
            );
            const transformer = new Transformer();
            transformer.addSource(idlPath, implsDir);
            await assert.rejects(transformer.generate(directory), /ObservableArray/u);
          } finally {
            fs.rmSync(directory, { recursive: true });
          }
        });
      }

      for (const [name, declaration] of [
        ["dictionary members", "dictionary Invalid { ObservableArray<DOMString> names; };"],
        [
          "namespace attributes",
          "[Exposed=Window] namespace Invalid { readonly attribute ObservableArray<long> names; };",
        ],
      ]) {
        test(name, async () => {
          const directory = fs.mkdtempSync(path.join(outputDir, "invalid-observable-array-"));
          try {
            const idlPath = path.join(directory, "Invalid.webidl");
            fs.writeFileSync(idlPath, declaration);
            const transformer = new Transformer();
            transformer.addSource(idlPath, implsDir);
            await assert.rejects(transformer.generate(directory), /ObservableArray/u);
          } finally {
            fs.rmSync(directory, { recursive: true });
          }
        });
      }
    });

    describe("platform object brand checks", () => {
      let BrandCheck,
        BrandCheckParent,
        BrandCheckGrandchild,
        BrandCheckSibling,
        utils,
        globalObject,
        wrapper,
        impl;

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
        const proxy = new Proxy(wrapper, {
          get: trap,
          getOwnPropertyDescriptor: trap,
          getPrototypeOf: trap,
        });
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
          Symbol("value"),
        ];
        const { childMethod } = wrapper;
        for (const value of invalid) {
          assert.strictEqual(BrandCheck.is(value), false);
          assert.throws(() => childMethod.call(value), globalObject.TypeError);
        }
      });

      test("preserves the realm and message of invalid receiver errors", () => {
        const parentPrototype = globalObject.BrandCheckParent.prototype;
        const valueDescriptor = Object.getOwnPropertyDescriptor(parentPrototype, "value");
        const cases = [
          ["BrandCheck", "childMethod", () => wrapper.childMethod.call({})],
          ["BrandCheckParent", "get value", () => valueDescriptor.get.call({})],
          ["BrandCheckParent", "set value", () => valueDescriptor.set.call({}, "value")],
          ["BrandCheckParent", "toString", () => parentPrototype.toString.call({})],
        ];

        for (const [interfaceName, context, invoke] of cases) {
          assert.throws(invoke, {
            constructor: globalObject.TypeError,
            message: `'${context}' called on an object that is not a valid instance of ${interfaceName}.`,
          });
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
        assert.strictEqual(
          utils.wrapperForImpl(utils.implForWrapper(customWrapper)),
          customWrapper,
        );

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
        execFileSync(
          process.execPath,
          [
            "-e",
            `
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
        `,
          ],
          { cwd: outputDir, stdio: "pipe" },
        );
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
        assert.deepStrictEqual(calls, [
          ["first", value],
          ["second", value],
          ["third", value],
        ]);
      });

      for (const name of ["BrandCheckIterable", "BrandCheckAsyncIterable"]) {
        test(`${name} rejects invalid receivers`, () => {
          const { globalObject, wrapper } = createIterable(name, []);
          const revocable = Proxy.revocable(wrapper, {});
          revocable.revoke();
          for (const receiver of [
            {},
            Object.create(wrapper),
            new Proxy(wrapper, {}),
            revocable.proxy,
          ]) {
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
        impl.values.push(
          ["first", utils.implForWrapper(value)],
          ["second", utils.implForWrapper(value)],
        );
        const iterator = wrapper.entries("1");
        assert.strictEqual(impl.offset, 1);
        const [first, second, returned] = await Promise.all([
          iterator.next(),
          iterator.next(),
          iterator.return("end"),
        ]);
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
        const { wrapper, impl } = createIterable("BrandCheckAsyncValueIterable", [
          "first",
          "second",
        ]);
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
          assert.throws(() => item.call(receiver, 0), /not a valid instance of HTMLCollection/u);
        }
      });

      test("indexed properties and ordinary fallbacks", () => {
        const { globalObject, wrapper } = createLegacyPlatformObject("URLList", {
          values: ["zero"],
        });

        assert.strictEqual(wrapper[0], "zero");
        assert.strictEqual(wrapper[1], undefined);

        Object.defineProperty(globalObject.URLList.prototype, "receiver", {
          configurable: true,
          get() {
            return this;
          },
        });
        const derived = Object.create(wrapper);
        assert.strictEqual(derived.receiver, derived);

        Object.defineProperty(wrapper, "ownAccessor", {
          configurable: true,
          get() {
            return this;
          },
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
          person: "named property",
        };
        const { implementation, wrapper } = createLegacyPlatformObject("HTMLCollection", {
          indexed: ["indexed property"],
          named,
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
        const { wrapper: wrapperWithOwnProperty } = createLegacyPlatformObject("HTMLCollection", {
          named: ownNamed,
        });
        Object.defineProperty(wrapperWithOwnProperty, "person", {
          configurable: true,
          value: "own property",
        });
        ownNamed.person = "named property";
        assert.strictEqual(wrapperWithOwnProperty.person, "own property");
      });

      test("skips named lookup for ordinary prototype properties", () => {
        const { wrapper, implementation } = createLegacyPlatformObject("HTMLCollection", {
          indexed: ["first", "second"],
          named: { length: "named length", item: "named item" },
        });
        for (let i = 0; i < 100; ++i) {
          assert.strictEqual(wrapper.length, 2);
        }
        assert.deepStrictEqual(Array.from(wrapper), ["first", "second"]);
        assert.strictEqual(typeof wrapper.item, "function");
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        assert.strictEqual("length" in wrapper, true);
        assert.deepStrictEqual(implementation.namedCalls, []);
        assert.strictEqual(wrapper.namedItem("length"), "named length");
        assert.deepStrictEqual(implementation.namedCalls, ["length"]);
      });

      describe("inherited prototype properties", () => {
        function createCollection(privateData = {}) {
          return createLegacyPlatformObject("HTMLFormControlsCollection", privateData, [
            "HTMLCollection",
          ]);
        }

        test("skips named lookups for inherited members during iteration", () => {
          const { wrapper, implementation } = createCollection({
            indexed: ["first", "second"],
            named: { length: "named length", item: "named item" },
          });
          assert.strictEqual(wrapper.length, 2);
          assert.strictEqual(typeof wrapper.item, "function");
          assert.deepStrictEqual(Array.from(wrapper), ["first", "second"]);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.strictEqual("length" in wrapper, true);
          assert.deepStrictEqual(implementation.namedCalls, []);
          assert.strictEqual(wrapper.namedItem("length"), "named length");
          assert.deepStrictEqual(implementation.namedCalls, ["length"]);
        });

        test("checks more than one ordinary ancestor", () => {
          const { wrapper, implementation } = createLegacyPlatformObject(
            "InheritedCollection",
            {
              indexed: ["first", "second"],
            },
            ["HTMLCollection", "HTMLFormControlsCollection"],
          );
          assert.deepStrictEqual(Array.from(wrapper), ["first", "second"]);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.deepStrictEqual(implementation.namedCalls, []);
        });

        test("reflects ancestor property changes without invoking accessors early", () => {
          const { globalObject, wrapper, implementation } = createCollection({
            named: { length: "named length", custom: "named custom" },
          });
          const { prototype } = globalObject.HTMLCollection;
          delete prototype.length;
          assert.strictEqual(wrapper.length, "named length");
          let getterCalls = 0;
          Object.defineProperty(prototype, "custom", {
            configurable: true,
            get() {
              ++getterCalls;
              return this;
            },
          });
          implementation.namedCalls.length = 0;
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "custom"), undefined);
          assert.strictEqual("custom" in wrapper, true);
          assert.strictEqual(getterCalls, 0);
          assert.strictEqual(wrapper.custom, wrapper);
          const derived = Object.create(wrapper);
          assert.strictEqual(derived.custom, derived);
          assert.strictEqual(getterCalls, 2);
          assert.deepStrictEqual(implementation.namedCalls, []);
          delete prototype.custom;
          assert.strictEqual(wrapper.custom, "named custom");
        });

        test("falls back for changed ancestors and resumes after restoring them", () => {
          const { globalObject, wrapper, implementation } = createCollection({
            indexed: ["element"],
            named: { length: "named length" },
          });
          const childPrototype = globalObject.HTMLFormControlsCollection.prototype;
          const parentPrototype = globalObject.HTMLCollection.prototype;
          const other = createCollection();
          Object.setPrototypeOf(childPrototype, other.globalObject.HTMLCollection.prototype);
          globalObject.HTMLCollection = new Proxy(() => {}, {
            get() {
              throw new Error("unexpected constructor property access");
            },
          });
          assert.strictEqual(wrapper.length, 1);
          assert.deepStrictEqual(implementation.namedCalls, ["length"]);
          Object.setPrototypeOf(childPrototype, parentPrototype);
          implementation.namedCalls.length = 0;
          assert.strictEqual(wrapper.length, 1);
          assert.deepStrictEqual(implementation.namedCalls, []);
          Object.setPrototypeOf(childPrototype, null);
          assert.strictEqual(wrapper.length, "named length");
        });

        test("does not probe a proxy inserted between ordinary prototypes", () => {
          const { globalObject, wrapper, implementation } = createCollection();
          const calls = [];
          function unexpected() {
            throw new Error("unexpected ancestor trap");
          }
          const proxy = new Proxy(globalObject.HTMLCollection.prototype, {
            getPrototypeOf: unexpected,
            getOwnPropertyDescriptor: unexpected,
            has: unexpected,
            get(target, property, receiver) {
              calls.push(property);
              return Reflect.get(target, property, receiver);
            },
          });
          Object.setPrototypeOf(globalObject.HTMLFormControlsCollection.prototype, proxy);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
          assert.strictEqual(wrapper.length, 0);
          assert.deepStrictEqual(implementation.namedCalls, ["length", "missing", "length"]);
          assert.deepStrictEqual(calls, ["length"]);
        });

        test("preserves supported-name lookup before observable ancestor checks", () => {
          const { globalObject, wrapper, implementation } = createCollection({
            named: { length: "named length" },
          });
          const marker = new Error("ancestor check");
          const proxy = new Proxy(globalObject.HTMLCollection.prototype, {
            getOwnPropertyDescriptor() {
              throw new Error("unexpected early ancestor check");
            },
            has() {
              assert.deepStrictEqual(implementation.namedCalls, ["length"]);
              throw marker;
            },
          });
          Object.setPrototypeOf(globalObject.HTMLFormControlsCollection.prototype, proxy);
          assert.throws(
            () => wrapper.length,
            (error) => error === marker,
          );
        });

        test("does not probe a revoked ancestor proxy", () => {
          const { globalObject, wrapper } = createCollection();
          const { proxy, revoke } = Proxy.revocable(globalObject.HTMLCollection.prototype, {});
          Object.setPrototypeOf(globalObject.HTMLFormControlsCollection.prototype, proxy);
          revoke();
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
          assert.throws(() => wrapper.length, TypeError);
        });

        test("does not trust an ancestor proxy present during installation", () => {
          const { globalObject } = createLegacyPlatformObject("HTMLCollection", {});
          const parentPrototype = globalObject.HTMLCollection.prototype;
          function unexpected() {
            throw new Error("unexpected ancestor trap");
          }
          globalObject.HTMLCollection = function HTMLCollection() {};
          globalObject.HTMLCollection.prototype = new Proxy(parentPrototype, {
            getPrototypeOf: unexpected,
            getOwnPropertyDescriptor: unexpected,
            has: unexpected,
          });
          const generated = require(path.resolve(outputDir, "HTMLFormControlsCollection.js"));
          generated.install(globalObject, ["Window"]);
          const wrapper = generated.create(globalObject);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
          assert.strictEqual(wrapper.length, 0);
        });

        test("stops before an unknown proxy above a captured ancestor", () => {
          const { globalObject, wrapper, implementation } = createCollection();
          const { prototype } = globalObject.HTMLCollection;
          const { proxy, revoke } = Proxy.revocable(Object.getPrototypeOf(prototype), {});
          Object.setPrototypeOf(prototype, proxy);
          revoke();
          assert.strictEqual(wrapper.length, 0);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.deepStrictEqual(implementation.namedCalls, []);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
          assert.deepStrictEqual(implementation.namedCalls, ["missing"]);
        });

        test("does not probe caller-supplied wrapper proxies", () => {
          const { globalObject } = createCollection();
          const generated = require(path.resolve(outputDir, "HTMLFormControlsCollection.js"));
          const target = new Proxy(
            Object.create(globalObject.HTMLFormControlsCollection.prototype),
            {
              getPrototypeOf() {
                throw new Error("unexpected wrapper prototype trap");
              },
            },
          );
          const wrapper = generated.setup(target, globalObject);
          assert.strictEqual(wrapper.length, 0);
          assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        });
      });

      test("reflects changes to ordinary prototype properties", () => {
        const { globalObject, wrapper, implementation } = createLegacyPlatformObject(
          "HTMLCollection",
          {
            named: { length: "named length", custom: "named custom" },
          },
        );
        const { prototype } = globalObject.HTMLCollection;
        delete prototype.length;
        assert.strictEqual(wrapper.length, "named length");
        assert.strictEqual(
          Object.getOwnPropertyDescriptor(wrapper, "length").value,
          "named length",
        );
        let getterCalls = 0;
        Object.defineProperty(prototype, "custom", {
          configurable: true,
          get() {
            ++getterCalls;
            return this;
          },
        });
        implementation.namedCalls.length = 0;
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "custom"), undefined);
        assert.strictEqual(getterCalls, 0);
        assert.strictEqual(wrapper.custom, wrapper);
        const derived = Object.create(wrapper);
        assert.strictEqual(derived.custom, derived);
        assert.strictEqual(getterCalls, 2);
        assert.deepStrictEqual(implementation.namedCalls, []);
        delete prototype.custom;
        assert.strictEqual(wrapper.custom, "named custom");
        Object.setPrototypeOf(wrapper, null);
        assert.strictEqual(wrapper.length, "named length");
      });

      test("captures the installed prototype independently of the public constructor", () => {
        const { globalObject, wrapper, implementation } = createLegacyPlatformObject(
          "HTMLCollection",
          {},
        );
        globalObject.HTMLCollection = new Proxy(() => {}, {
          get() {
            throw new Error("unexpected constructor property access");
          },
        });
        assert.strictEqual(wrapper.length, 0);
        assert.deepStrictEqual(implementation.namedCalls, []);
      });

      test("does not inspect unrecognized prototype proxies for unsupported names", () => {
        const { globalObject, wrapper } = createLegacyPlatformObject("HTMLCollection", {});
        const calls = [];
        function unexpected() {
          throw new Error("unexpected prototype trap");
        }
        Object.setPrototypeOf(
          wrapper,
          new Proxy(globalObject.HTMLCollection.prototype, {
            getPrototypeOf: unexpected,
            getOwnPropertyDescriptor: unexpected,
            has: unexpected,
            get(target, property, receiver) {
              calls.push(property);
              return Reflect.get(target, property, receiver);
            },
          }),
        );
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
        assert.strictEqual(wrapper.length, 0);
        assert.deepStrictEqual(calls, ["length"]);
      });

      test("does not inspect revoked prototype proxies for unsupported names", () => {
        const { globalObject, wrapper } = createLegacyPlatformObject("HTMLCollection", {});
        const { proxy, revoke } = Proxy.revocable(globalObject.HTMLCollection.prototype, {});
        Object.setPrototypeOf(wrapper, proxy);
        revoke();
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        assert.throws(() => wrapper.length, TypeError);
      });

      test("does not traverse beyond the captured prototype", () => {
        const { globalObject, wrapper, implementation } = createLegacyPlatformObject(
          "HTMLCollection",
          {},
        );
        const { prototype } = globalObject.HTMLCollection;
        const { proxy, revoke } = Proxy.revocable(Object.getPrototypeOf(prototype), {});
        Object.setPrototypeOf(prototype, proxy);
        revoke();
        assert.strictEqual(wrapper.length, 0);
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        assert.deepStrictEqual(implementation.namedCalls, []);
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
      });

      test("preserves the supported-name lookup before observable prototype checks", () => {
        const { globalObject, wrapper, implementation } = createLegacyPlatformObject(
          "HTMLCollection",
          {
            named: { length: "named length" },
          },
        );
        const marker = new Error("prototype check");
        Object.setPrototypeOf(
          wrapper,
          new Proxy(globalObject.HTMLCollection.prototype, {
            has() {
              assert.deepStrictEqual(implementation.namedCalls, ["length"]);
              throw marker;
            },
          }),
        );
        assert.throws(
          () => wrapper.length,
          (error) => error === marker,
        );
      });

      test("preserves indexed property precedence over ordinary prototype properties", () => {
        const { globalObject, wrapper, implementation } = createLegacyPlatformObject(
          "HTMLCollection",
          {
            indexed: ["indexed value"],
            named: { 0: "named value", 1: "unsupported index" },
          },
        );
        Object.defineProperty(globalObject.HTMLCollection.prototype, "0", {
          get() {
            throw new Error("unexpected prototype getter");
          },
        });
        assert.strictEqual(wrapper[0], "indexed value");
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "0").value, "indexed value");
        assert.strictEqual(wrapper[1], undefined);
        assert.deepStrictEqual(implementation.namedCalls, []);
      });

      test("preserves caller-supplied proxy wrappers passed to setup", () => {
        const { globalObject } = createLegacyPlatformObject("HTMLCollection", {});
        const generated = require(path.resolve(outputDir, "HTMLCollection.js"));
        const target = new Proxy(Object.create(globalObject.HTMLCollection.prototype), {
          getPrototypeOf() {
            throw new Error("unexpected wrapper prototype trap");
          },
        });
        const wrapper = generated.setup(target, globalObject);
        assert.strictEqual(wrapper.length, 0);
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
      });

      test("optimizes internally created wrappers with delayed implementation initialization", () => {
        const { globalObject } = createLegacyPlatformObject("HTMLCollection", {});
        const generated = require(path.resolve(outputDir, "HTMLCollection.js"));
        const utils = require(path.resolve(outputDir, "utils.js"));
        const implementation = generated.new(globalObject);
        implementation._indexed = [];
        implementation._named = {};
        implementation.indexedCalls = [];
        implementation.namedCalls = [];
        const wrapper = utils.wrapperForImpl(implementation);
        assert.strictEqual(wrapper.length, 0);
        assert.deepStrictEqual(implementation.namedCalls, []);
      });

      test("optimizes public constructors and separate supported-name checks", () => {
        const generated = require(path.resolve(outputDir, "NamedProperties.js"));
        const utils = require(path.resolve(outputDir, "utils.js"));
        const globalObject = vm.runInNewContext("globalThis");
        generated.install(globalObject, ["Window"]);
        const wrapper = new globalObject.NamedProperties();
        const implementation = utils.implForWrapper(wrapper);
        implementation.entries.set("length", "named length");
        assert.strictEqual(wrapper.length, 1);
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        assert.deepStrictEqual(implementation.supportsCalls, []);
        assert.deepStrictEqual(implementation.namedCalls, []);
        assert.strictEqual(wrapper.namedItem("length"), "named length");
        assert.deepStrictEqual(implementation.supportsCalls, []);
        assert.deepStrictEqual(implementation.namedCalls, ["length"]);
        assert.strictEqual(wrapper.missing, undefined);
        assert.deepStrictEqual(implementation.supportsCalls, ["missing"]);
        assert.deepStrictEqual(implementation.namedCalls, ["length"]);
        delete globalObject.NamedProperties.prototype.length;
        assert.strictEqual(wrapper.length, "named length");
        assert.deepStrictEqual(implementation.supportsCalls, ["missing", "length"]);
        assert.deepStrictEqual(implementation.namedCalls, ["length", "length"]);
      });

      test("preserves lookups after changing to another realm's prototype", () => {
        const { wrapper } = createLegacyPlatformObject("HTMLCollection", { indexed: ["element"] });
        const { globalObject } = createLegacyPlatformObject("HTMLCollection", {});
        Object.setPrototypeOf(wrapper, globalObject.HTMLCollection.prototype);
        assert.strictEqual(wrapper.length, 1);
        assert.strictEqual(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
      });

      test("LegacyOverrideBuiltins named properties", () => {
        const entries = { inherited: "named property" };
        const { globalObject, wrapper } = createLegacyPlatformObject("LegacyOverrideBuiltins", {
          entries,
        });
        Object.defineProperty(globalObject.LegacyOverrideBuiltins.prototype, "inherited", {
          configurable: true,
          value: "inherited property",
        });
        assert.strictEqual(wrapper.inherited, "named property");

        const ownEntries = {};
        const { wrapper: wrapperWithOwnProperty } = createLegacyPlatformObject(
          "LegacyOverrideBuiltins",
          {
            entries: ownEntries,
          },
        );
        Object.defineProperty(wrapperWithOwnProperty, "own", {
          configurable: true,
          value: "own property",
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
          const reflectAttr = idl.extAttrs.find((attr) => attr.name === "Reflect");
          const attrName =
            (reflectAttr && reflectAttr.rhs && reflectAttr.rhs.value.replace(/_/gu, "-")) ||
            idl.name.toLowerCase();
          if (idl.idlType.idlType === "USVString") {
            const reflectURL = idl.extAttrs.find((attr) => attr.name === "ReflectURL");
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
                `,
              };
            }
          }
          const reflect = reflector[idl.idlType.idlType];
          return {
            get: reflect.get(implObj, attrName),
            set: reflect.set(implObj, attrName),
          };
        },
      });
      transformer.addSource(casesDir, implsDir);

      return transformer.generate(outputDir);
    });

    for (const idlFile of idlFiles) {
      test(idlFile, (t) => {
        const basename = path.basename(idlFile, ".webidl");
        const outputFile = path.resolve(outputDir, `${basename}.js`);
        const output = fs.readFileSync(outputFile, { encoding: "utf-8" });

        t.assert.fileSnapshot(
          output,
          path.resolve(snapshotsDir, "with-processors", `${basename}.js`),
        );
      });
    }
  });

  test("utils.js", () => {
    const input = fs.readFileSync(path.resolve(rootDir, "lib/output/utils.js"), {
      encoding: "utf-8",
    });
    const output = fs.readFileSync(path.resolve(outputDir, "utils.js"), { encoding: "utf-8" });
    assert.strictEqual(output, input);
  });
});
