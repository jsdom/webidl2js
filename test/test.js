"use strict";

const { describe, test, before, beforeEach, snapshot } = require("node:test");
const { execFileSync } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const webidl = require("webidl2");
const idlConversions = require("webidl-conversions");

snapshot.setDefaultSnapshotSerializers([(value) => value]);
const Transformer = require("..");
const Types = require("../lib/types");
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
  for (const [type, wrapped] of [
    ["octet", 255],
    ["(octet or DOMString)", 255],
    ["DOMTimeStamp", 2 ** 64],
  ]) {
    test(`conversion attributes remain local to each use of ${type}`, () => {
      const { ctx } = new Transformer();
      const [{ idlType }] = webidl.parse(`typedef ${type} Test;`);
      const original = JSON.stringify(idlType);
      const resolved = Types.resolveType(ctx, idlType);
      const originalResolved = JSON.stringify(resolved);

      function convert(attrs) {
        const { body } = Types.generateTypeConversion(ctx, "value", idlType, attrs);
        const run = vm.compileFunction(`${body}\nreturn value;`, [
          "value",
          "conversions",
          "globalObject",
        ]);
        return run(-1, idlConversions, globalThis);
      }

      assert.equal(convert([{ name: "Clamp" }]), 0);
      assert.equal(convert([]), wrapped);
      assert.throws(() => convert([{ name: "EnforceRange" }]), TypeError);
      assert.equal(convert([]), wrapped);
      assert.equal(JSON.stringify(idlType), original);
      assert.equal(JSON.stringify(resolved), originalResolved);
    });
  }

  describe("built-in types", () => {
    before(() => {
      const transformer = new Transformer();
      transformer.addSource(path.join(casesDir, "CallbackUsage.webidl"), implsDir);
      return transformer.generate(outputDir);
    });

    for (const [name, idl, expected] of [
      ["no sources", "", []],
      ["no callbacks", "[Exposed=Window] interface Example { attribute DOMString value; };", []],
      [
        "Function argument",
        "[Exposed=Window] interface Example { undefined run(Function callback); };",
        ["Function.js"],
      ],
      [
        "VoidFunction attribute",
        "[Exposed=Window] interface Example { attribute VoidFunction handler; };",
        ["VoidFunction.js"],
      ],
      [
        "nested types and typedefs",
        `typedef (Function or DOMString) Callback;
         dictionary Options { sequence<Callback> callbacks; VoidFunction? done = null; };`,
        ["Function.js", "VoidFunction.js"],
      ],
      [
        "namespace operation",
        "[Exposed=Window] namespace Example { undefined run(VoidFunction callback); };",
        ["VoidFunction.js"],
      ],
      ["callback return value", "callback Factory = Function ();", ["Function.js"]],
      [
        "callback interface return value",
        "callback interface Factory { VoidFunction create(); };",
        ["VoidFunction.js"],
      ],
      [
        "pair iterable's implicit dependency",
        "[Exposed=Window] interface Example { iterable<DOMString, DOMString>; };",
        ["Function.js"],
      ],
      [
        "types that need no conversion module",
        `typedef Function Unused;
         interface mixin UnusedMixin { undefined run(VoidFunction callback); };
         [Exposed=Window] interface Example { readonly attribute Function handler; };`,
        [],
      ],
      [
        "explicit callback definitions",
        "callback Function = any (any... arguments); callback VoidFunction = undefined ();",
        ["Function.js", "VoidFunction.js"],
      ],
    ]) {
      test(`only emits needed callback helpers: ${name}`, async (t) => {
        const directory = fs.mkdtempSync(path.join(outputDir, "built-in-types-"));
        t.after(() => fs.rmSync(directory, { recursive: true }));
        const transformer = new Transformer();
        if (idl) {
          const idlPath = path.join(directory, "input.webidl");
          fs.writeFileSync(idlPath, idl);
          transformer.addSource(idlPath, implsDir);
        }
        await transformer.generate(directory);
        assert.deepEqual(
          fs
            .readdirSync(directory)
            .filter((file) => ["Function.js", "VoidFunction.js"].includes(file)),
          expected,
        );
      });
    }

    test("recomputes callback dependencies when reusing a transformer", async (t) => {
      const directory = fs.mkdtempSync(path.join(outputDir, "built-in-types-"));
      t.after(() => fs.rmSync(directory, { recursive: true }));
      const idlPath = path.join(directory, "input.webidl");
      const transformer = new Transformer();
      transformer.addSource(idlPath, implsDir);

      async function checkGeneration(callback) {
        fs.writeFileSync(idlPath, `dictionary Options { ${callback} handler; };`);
        await transformer.generate(directory);
        assert.deepEqual(
          fs.readdirSync(directory).sort(),
          [`${callback}.js`, "Options.js", "input.webidl", "utils.js"].sort(),
        );
        for (const file of fs.readdirSync(directory)) {
          fs.unlinkSync(path.join(directory, file));
        }
      }

      await checkGeneration("Function");
      await checkGeneration("VoidFunction");
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

      assert.equal(get.call(wrapper), "initial");
      set.call(wrapper, 42);
      assert.equal(get.call(wrapper), "42");

      for (const receiver of [undefined, null, {}, new Proxy(wrapper, {})]) {
        assert.equal(get.call(receiver), undefined);
        assert.equal(set.call(receiver, Symbol("not convertible")), undefined);
      }
      assert.equal(get.call(wrapper), "42");
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
        assert.equal(utils.observableArraySet("names"), utils.observableArraySet("names"));
        assert.equal(utils.observableArrayDelete("names"), utils.observableArrayDelete("names"));
        assert.notEqual(utils.observableArraySet("names"), utils.observableArraySet("employees"));
        assert.notEqual(utils.observableArraySet("names"), utils.observableArrayDelete("names"));
      });

      test("preserves the proxy and backing list across assignment and self-assignment", () => {
        const array = wrapper.names;
        const list = impl.names;
        wrapper.names = [1, "two"];
        assert.equal(wrapper.names, array);
        assert.equal(impl.names, list);
        assert.deepEqual([...array], ["1", "two"]);
        assert.deepEqual(list, ["1", "two"]);
        wrapper.names = array;
        assert.equal(wrapper.names, array);
        assert.deepEqual(list, ["1", "two"]);
        assert.notEqual(new globalObject.ObservableArrays().names, array);
      });

      test("reflects implementation mutations without conversion or hooks", () => {
        const array = wrapper.names;
        impl.names.push("one", "two");
        assert.deepEqual([...array], ["one", "two"]);
        impl.names.splice(0, 1, "three");
        assert.deepEqual([...array], ["three", "two"]);
        impl.names.length = 0;
        assert.equal(array.length, 0);
        assert.deepEqual(impl.events, []);
      });

      test("converts elements and runs hooks before changing the list", () => {
        wrapper.names.push(1);
        wrapper.names[0] = 2;
        wrapper.names.push("three");
        wrapper.names.length = 0;
        assert.deepEqual(impl.events, [
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
        assert.deepEqual(impl.names, ["original"]);
        assert.deepEqual(impl.events, []);

        let conversions = 0;
        wrapper.names = [
          {
            toString() {
              ++conversions;
              return "new";
            },
          },
        ];
        assert.equal(conversions, 1);
        assert.deepEqual(impl.events, [
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
          assert.deepEqual(impl.names, ["new"]);
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
        assert.deepEqual(impl.names, ["one", "two"]);

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
        assert.deepEqual(impl.names, ["good"]);
        impl.events.length = 0;
        assert.throws(
          () => {
            wrapper.names[0] = "bad";
          },
          (error) => error === marker,
        );
        assert.deepEqual(impl.names, ["good"]);
        assert.deepEqual(impl.events, [
          ["delete", "good", 0, ["good"]],
          ["set", "bad", 0, ["good"]],
        ]);
      });

      test("stores impls and exposes wrappers, including property descriptors", () => {
        const employee = new globalObject.ObservableArrays();
        const employeeImpl = utils.implForWrapper(employee);
        wrapper.employees.push(employee, null);
        assert.deepEqual(impl.employees, [employeeImpl, null]);
        assert.deepEqual([...wrapper.employees], [employee, null]);
        assert.equal(Object.getOwnPropertyDescriptor(wrapper.employees, "0").value, employee);
        assert.deepEqual(impl.events, [
          ["employee set", employeeImpl, 0],
          ["employee set", null, 1],
        ]);

        wrapper.employees = [employee];
        assert.deepEqual(impl.employees, [employeeImpl]);
        assert.equal(wrapper.employees.pop(), employee);
        assert.deepEqual(impl.events.at(-1), ["employee delete", employeeImpl, 0]);
        assert.throws(() => wrapper.employees.push({}), globalObject.TypeError);
        assert.deepEqual(impl.employees, []);
      });

      test("round-trips callback elements without converting them twice", () => {
        let calls = 0;
        function callback() {
          ++calls;
        }
        wrapper.callbacks = [callback];
        assert.equal(wrapper.callbacks[0], callback);
        impl.callbacks[0]();
        assert.equal(calls, 1);
        wrapper.callbacks.push(callback);
        assert.equal(wrapper.callbacks[1], callback);
      });

      test("supports readonly attributes and omitted hooks", () => {
        const array = wrapper.readonlyNames;
        array.push(42);
        assert.deepEqual(impl.readonlyNames, ["42"]);
        assert.throws(() => {
          wrapper.readonlyNames = [];
        }, TypeError);
        assert.equal(wrapper.readonlyNames, array);
        assert.deepEqual(impl.events, []);
        wrapper.numbers = [1.9, 2 ** 32 + 2];
        assert.deepEqual(impl.numbers, [1, 2]);
      });

      test("supports frozen array elements", () => {
        wrapper.groups = [[1, "two"]];
        wrapper.groups.push(new Set([3]));
        assert.deepEqual(wrapper.groups[0], ["1", "two"]);
        assert.deepEqual(wrapper.groups[1], ["3"]);
        assert(Object.isFrozen(wrapper.groups[0]));
        assert.equal(wrapper.groups[0], impl.groups[0]);
      });

      test("supports native array methods and array identity checks", () => {
        const array = wrapper.names;
        assert(Array.isArray(array));
        assert(array instanceof globalObject.Array);
        assert.equal(array.constructor, globalObject.Array);
        array.push("b", "c");
        array.unshift("a");
        assert.equal(array.shift(), "a");
        assert.deepEqual([...array.splice(0, 1, "x", "y")], ["b"]);
        array.reverse();
        assert.deepEqual([...array], ["c", "y", "x"]);
        assert.deepEqual([...array.map((value) => value.toUpperCase())], ["C", "Y", "X"]);
        assert.deepEqual([].concat(array), ["c", "y", "x"]);
        assert.equal(JSON.stringify(array), '["c","y","x"]');
      });

      test("rejects holes, length growth, and deleting anything except the last index", () => {
        const array = wrapper.names;
        assert.equal(Reflect.set(array, "1", Symbol("not converted")), false);
        assert.equal(Reflect.set(array, "length", 1), false);
        array.push("one", "two");
        assert.equal(Reflect.deleteProperty(array, "0"), false);
        assert.equal(Reflect.deleteProperty(array, "2"), false);
        assert.equal(Reflect.deleteProperty(array, "length"), false);
        assert.equal(Reflect.deleteProperty(array, "1"), true);
        assert.deepEqual([...array], ["one"]);
        assert.equal(Reflect.set(array, "length", 0), true);
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
        assert.equal(calls, 2);
        assert.deepEqual(impl.names, []);
      });

      test("exposes virtual descriptors and keys while preserving ordinary properties", () => {
        const array = wrapper.names;
        impl.names.push("one", "two");
        const symbol = Symbol("extra");
        array.extra = 1;
        array["01"] = "ordinary";
        array[2 ** 32 - 1] = "also ordinary";
        array[symbol] = 2;
        assert.deepEqual(Reflect.ownKeys(array), [
          "0",
          "1",
          "length",
          "extra",
          "01",
          "4294967295",
          symbol,
        ]);
        assert.deepEqual(Object.getOwnPropertyDescriptor(array, "length"), {
          value: 2,
          writable: true,
          enumerable: false,
          configurable: false,
        });
        assert.deepEqual(Object.getOwnPropertyDescriptor(array, "0"), {
          value: "one",
          writable: true,
          enumerable: true,
          configurable: true,
        });
        assert.equal(Object.getOwnPropertyDescriptor(array, "2"), undefined);
        assert.equal("1" in array, true);
        assert.equal("2" in array, false);
        assert.equal("length" in array, true);
        assert.equal("extra" in array, true);
        assert.equal(array[symbol], 2);
        assert.equal(Reflect.deleteProperty(array, "extra"), true);
        assert.equal("extra" in array, false);

        const receiver = {};
        Reflect.set(array, "other", 3, receiver);
        assert.equal(receiver.other, 3);
        assert.equal(array.other, undefined);
        Reflect.set(array, "0", "changed", receiver);
        assert.equal(array[0], "changed");
        assert.equal(receiver[0], undefined);
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
          assert.equal(Reflect.defineProperty(array, "0", descriptor), false);
        }
        for (const descriptor of [
          { get() {} },
          { writable: false },
          { enumerable: true },
          { configurable: true },
        ]) {
          assert.equal(Reflect.defineProperty(array, "length", descriptor), false);
        }
        assert.equal(Reflect.defineProperty(array, "0", { value: 42 }), true);
        assert.equal(array[0], "42");
        const events = impl.events.length;
        assert.equal(Reflect.defineProperty(array, "0", {}), true);
        assert.equal(impl.events.length, events);
        assert.equal(Reflect.defineProperty(array, "length", { value: 0 }), true);
        assert.equal(array.length, 0);
        assert.equal(Reflect.preventExtensions(array), false);
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
        assert.equal(Object.getPrototypeOf(array), otherGlobal.Array.prototype);
        assert.equal(array, other.names);
        set.call(other, [42]);
        assert.deepEqual([...array], ["42"]);
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
        assert.equal(Object.getPrototypeOf(instance.names), arrayPrototype);
        instance.names.push("one");
        assert.deepEqual([...instance.names], ["one"]);
      });

      test("ignores inherited indexed properties outside the backing list", () => {
        const array = wrapper.names;
        const prototype = Object.create(globalObject.Array.prototype);
        prototype[0] = "inherited";
        Object.setPrototypeOf(array, prototype);
        assert.equal(array[0], undefined);
        assert.equal("0" in array, false);
        assert.equal(Object.getOwnPropertyDescriptor(array, "0"), undefined);
        impl.names.push("own");
        assert.equal(array[0], "own");
        assert.equal("0" in array, true);
      });

      test("supports inherited and mixed-in attributes through every creation path", () => {
        const child = require(path.resolve(outputDir, "ObservableArraysChild.js"));
        child.install(globalObject, ["Window"]);
        for (const module of [generated, child]) {
          const createdImpl = module.new(globalObject);
          assert.equal(createdImpl.names, undefined);
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
            assert.deepEqual(implementation.names, ["one"]);
            assert.deepEqual(implementation.numbers, [2]);
            assert.equal(Object.getPrototypeOf(instance.names), globalObject.Array.prototype);
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
        assert.equal(BrandCheck.is(wrapper), true);
        assert.equal(BrandCheckParent.is(wrapper), true);
        assert.equal(BrandCheck.isImpl(impl), true);
        assert.equal(BrandCheckParent.isImpl(impl), false);
        assert.equal(BrandCheck.convert(globalObject, wrapper), impl);
        assert.equal(BrandCheckParent.convert(globalObject, wrapper), impl);

        const parent = BrandCheckParent.create(globalObject);
        assert.equal(BrandCheck.is(parent), false);

        const grandchild = new globalObject.BrandCheckGrandchild();
        assert.equal(BrandCheckParent.is(grandchild), true);
        assert.equal(BrandCheck.is(grandchild), true);
        assert.equal(BrandCheckGrandchild.is(grandchild), true);
        assert.equal(BrandCheckSibling.is(grandchild), false);
        assert.equal(grandchild.parentMethod(), "parent:grandchild");
        assert.equal(grandchild.childMethod(), "child:grandchild");
        assert.equal(grandchild.grandchildMethod(), "grandchild:grandchild");

        const sibling = new globalObject.BrandCheckSibling();
        assert.equal(BrandCheckParent.is(sibling), true);
        assert.equal(BrandCheck.is(sibling), false);
        assert.equal(BrandCheckGrandchild.is(sibling), false);
        assert.equal(BrandCheckSibling.is(sibling), true);
        assert.equal(sibling.siblingMethod(), "sibling:sibling");
      });

      test("unwraps receivers for operations, attributes, and stringifiers", () => {
        assert.equal(wrapper.value, "initial");
        wrapper.value = "changed";
        assert.equal(wrapper.parentMethod(), "parent:changed");
        assert.equal(wrapper.childMethod(), "child:changed");
        assert.equal(wrapper.toString(), "changed");
        assert.equal(wrapper.shadow("argument"), "shadow:argument");
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
        assert.equal(BrandCheck.is(proxy), false);
        assert.equal(BrandCheckParent.is(proxy), false);
        assert.throws(() => BrandCheck.convert(globalObject, proxy), globalObject.TypeError);
        assert.throws(() => wrapper.childMethod.call(proxy), globalObject.TypeError);
        assert.throws(() => parentPrototype.parentMethod.call(proxy), globalObject.TypeError);
        assert.throws(() => parentPrototype.toString.call(proxy), globalObject.TypeError);
        assert.throws(() => valueDescriptor.get.call(proxy), globalObject.TypeError);
        assert.throws(() => valueDescriptor.set.call(proxy, "proxy"), globalObject.TypeError);
        assert.equal(trapCalls, 0);
        assert.equal(wrapper.value, "initial");
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
          assert.equal(BrandCheck.is(value), false);
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
        assert.equal(parentMethod.call(wrapper), "parent:initial");

        Object.setPrototypeOf(wrapper, null);
        assert.equal(BrandCheck.is(wrapper), true);
        assert.equal(BrandCheckParent.is(wrapper), true);
        assert.equal(childMethod.call(wrapper), "child:initial");
        assert.equal(parentMethod.call(wrapper), "parent:initial");
        assert.equal(toString.call(wrapper), "initial");
      });

      test("registers setup(), new(), and createImpl() results before initialization", () => {
        assert.equal(impl.wrapperSeenDuringInit, wrapper);
        const customWrapper = Object.create(globalObject.BrandCheck.prototype);
        assert.equal(BrandCheck.setup(customWrapper, globalObject), customWrapper);
        assert.equal(BrandCheck.is(customWrapper), true);
        assert.equal(utils.wrapperForImpl(utils.implForWrapper(customWrapper)), customWrapper);

        for (const newImpl of [BrandCheck.new(globalObject), BrandCheck.createImpl(globalObject)]) {
          const newWrapper = utils.wrapperForImpl(newImpl);
          assert.equal(BrandCheck.is(newWrapper), true);
          assert.equal(BrandCheckParent.is(newWrapper), true);
          assert.equal(newImpl.wrapperSeenDuringInit, newWrapper);
        }
      });

      test("unwraps wrappers but preserves other objects in object unions", () => {
        const plainObject = {};
        for (const value of [plainObject, new Proxy(wrapper, {})]) {
          wrapper.objectUnion(value);
          assert.equal(impl.lastObjectUnionValue, value);
        }
        wrapper.objectUnion(wrapper);
        assert.equal(impl.lastObjectUnionValue, impl);
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
        assert.deepEqual(iterator.next().value, ["first", value]);
        values.push(["second", utils.implForWrapper(value)]);
        assert.deepEqual(iterator.next().value, ["second", value]);
        assert.equal(iterator.next().done, true);
        assert.deepEqual([...wrapper.keys()], ["first", "second"]);
        assert.deepEqual([...wrapper.values()], [value, value]);

        const calls = [];
        const thisArg = {};
        wrapper.forEach(function (entry, key, receiver) {
          assert.equal(this, thisArg);
          assert.equal(receiver, wrapper);
          calls.push([key, entry]);
          if (key === "second") {
            values.push(["third", utils.implForWrapper(value)]);
          }
        }, thisArg);
        assert.deepEqual(calls, [
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
        assert.equal(impl.offset, 1);
        const [first, second, returned] = await Promise.all([
          iterator.next(),
          iterator.next(),
          iterator.return("end"),
        ]);
        assert.deepEqual(first.value, ["first", value]);
        assert.deepEqual(second.value, ["second", value]);
        assert.equal(returned.done, true);
        assert.equal(returned.value, "end");
        assert.deepEqual(impl.calls, ["next", "next", "return"]);
        assert.equal(impl.returnValue, "end");
        assert.equal((await iterator.next()).done, true);
        assert.equal((await iterator.return("again")).value, "again");
        assert.deepEqual(impl.calls, ["next", "next", "return"]);

        const keys = wrapper.keys(1);
        assert.equal((await keys.next()).value, "first");
        const entries = [];
        for await (const item of wrapper.values(1)) {
          entries.push(item);
        }
        assert.deepEqual(entries, [value, value]);
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
        assert.deepEqual(values, ["first", "second"]);
        assert.deepEqual(impl.calls, ["next", "next", "next"]);
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
        assert.notEqual(wrapper, target);
        assert.equal(utils.implForWrapper(target), impl);
        assert.equal(impl.wrapperSeenDuringInit, wrapper);
        assert.equal(URLList.is(wrapper), true);
        for (const receiver of [target, Object.create(wrapper), new Proxy(wrapper, {})]) {
          assert.equal(URLList.is(receiver), false);
          assert.throws(() => wrapper.item.call(receiver, 0), globalObject.TypeError);
        }
        assert.equal(wrapper[0], "zero");
      });

      test("borrowed methods accept wrappers from another realm and reject invalid receivers", () => {
        const first = createLegacyPlatformObject("HTMLCollection", {});
        const indexed = ["first"];
        const second = createLegacyPlatformObject("HTMLCollection", { indexed });
        const { item } = first.globalObject.HTMLCollection.prototype;

        assert.equal(item.call(second.wrapper, 0), "first");
        indexed.push("second");
        assert.equal(second.wrapper.length, 2);
        assert.equal(item.call(second.wrapper, 1), "second");

        for (const receiver of [null, {}, Object.create(second.wrapper)]) {
          assert.throws(() => item.call(receiver, 0), /not a valid instance of HTMLCollection/u);
        }
      });

      test("indexed properties and ordinary fallbacks", () => {
        const { globalObject, wrapper } = createLegacyPlatformObject("URLList", {
          values: ["zero"],
        });

        assert.equal(wrapper[0], "zero");
        assert.equal(wrapper[1], undefined);

        Object.defineProperty(globalObject.URLList.prototype, "receiver", {
          configurable: true,
          get() {
            return this;
          },
        });
        const derived = Object.create(wrapper);
        assert.equal(derived.receiver, derived);

        Object.defineProperty(wrapper, "ownAccessor", {
          configurable: true,
          get() {
            return this;
          },
        });
        assert.equal(wrapper.ownAccessor, wrapper);

        const symbol = Symbol("test");
        wrapper[symbol] = "symbol value";
        assert.equal(wrapper[symbol], "symbol value");

        Object.setPrototypeOf(wrapper, null);
        assert.equal(wrapper.missing, undefined);
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
        assert.equal(wrapper[0], "indexed property");
        assert.deepEqual(implementation.indexedCalls, [0]);
        assert.deepEqual(implementation.namedCalls, []);

        assert.equal(wrapper[1], undefined);
        assert.deepEqual(implementation.indexedCalls, [0, 1]);
        assert.deepEqual(implementation.namedCalls, []);

        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "1"), undefined);
        assert.deepEqual(implementation.indexedCalls, [0, 1, 1]);
        assert.deepEqual(implementation.namedCalls, []);

        assert.equal(wrapper.person, "named property");
        assert.deepEqual(implementation.namedCalls, ["person"]);
        assert.equal(typeof wrapper.item, "function");

        const ownNamed = {};
        const { wrapper: wrapperWithOwnProperty } = createLegacyPlatformObject("HTMLCollection", {
          named: ownNamed,
        });
        Object.defineProperty(wrapperWithOwnProperty, "person", {
          configurable: true,
          value: "own property",
        });
        ownNamed.person = "named property";
        assert.equal(wrapperWithOwnProperty.person, "own property");
      });

      test("skips named lookup for ordinary prototype properties", () => {
        const { wrapper, implementation } = createLegacyPlatformObject("HTMLCollection", {
          indexed: ["first", "second"],
          named: { length: "named length", item: "named item" },
        });
        for (let i = 0; i < 100; ++i) {
          assert.equal(wrapper.length, 2);
        }
        assert.deepEqual(Array.from(wrapper), ["first", "second"]);
        assert.equal(typeof wrapper.item, "function");
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        assert.equal("length" in wrapper, true);
        assert.deepEqual(implementation.namedCalls, []);
        assert.equal(wrapper.namedItem("length"), "named length");
        assert.deepEqual(implementation.namedCalls, ["length"]);
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
          assert.equal(wrapper.length, 2);
          assert.equal(typeof wrapper.item, "function");
          assert.deepEqual(Array.from(wrapper), ["first", "second"]);
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.equal("length" in wrapper, true);
          assert.deepEqual(implementation.namedCalls, []);
          assert.equal(wrapper.namedItem("length"), "named length");
          assert.deepEqual(implementation.namedCalls, ["length"]);
        });

        test("checks more than one ordinary ancestor", () => {
          const { wrapper, implementation } = createLegacyPlatformObject(
            "InheritedCollection",
            {
              indexed: ["first", "second"],
            },
            ["HTMLCollection", "HTMLFormControlsCollection"],
          );
          assert.deepEqual(Array.from(wrapper), ["first", "second"]);
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.deepEqual(implementation.namedCalls, []);
        });

        test("reflects ancestor property changes without invoking accessors early", () => {
          const { globalObject, wrapper, implementation } = createCollection({
            named: { length: "named length", custom: "named custom" },
          });
          const { prototype } = globalObject.HTMLCollection;
          delete prototype.length;
          assert.equal(wrapper.length, "named length");
          let getterCalls = 0;
          Object.defineProperty(prototype, "custom", {
            configurable: true,
            get() {
              ++getterCalls;
              return this;
            },
          });
          implementation.namedCalls.length = 0;
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "custom"), undefined);
          assert.equal("custom" in wrapper, true);
          assert.equal(getterCalls, 0);
          assert.equal(wrapper.custom, wrapper);
          const derived = Object.create(wrapper);
          assert.equal(derived.custom, derived);
          assert.equal(getterCalls, 2);
          assert.deepEqual(implementation.namedCalls, []);
          delete prototype.custom;
          assert.equal(wrapper.custom, "named custom");
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
          assert.equal(wrapper.length, 1);
          assert.deepEqual(implementation.namedCalls, ["length"]);
          Object.setPrototypeOf(childPrototype, parentPrototype);
          implementation.namedCalls.length = 0;
          assert.equal(wrapper.length, 1);
          assert.deepEqual(implementation.namedCalls, []);
          Object.setPrototypeOf(childPrototype, null);
          assert.equal(wrapper.length, "named length");
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
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
          assert.equal(wrapper.length, 0);
          assert.deepEqual(implementation.namedCalls, ["length", "missing", "length"]);
          assert.deepEqual(calls, ["length"]);
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
              assert.deepEqual(implementation.namedCalls, ["length"]);
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
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
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
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
          assert.equal(wrapper.length, 0);
        });

        test("stops before an unknown proxy above a captured ancestor", () => {
          const { globalObject, wrapper, implementation } = createCollection();
          const { prototype } = globalObject.HTMLCollection;
          const { proxy, revoke } = Proxy.revocable(Object.getPrototypeOf(prototype), {});
          Object.setPrototypeOf(prototype, proxy);
          revoke();
          assert.equal(wrapper.length, 0);
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
          assert.deepEqual(implementation.namedCalls, []);
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
          assert.deepEqual(implementation.namedCalls, ["missing"]);
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
          assert.equal(wrapper.length, 0);
          assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
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
        assert.equal(wrapper.length, "named length");
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length").value, "named length");
        let getterCalls = 0;
        Object.defineProperty(prototype, "custom", {
          configurable: true,
          get() {
            ++getterCalls;
            return this;
          },
        });
        implementation.namedCalls.length = 0;
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "custom"), undefined);
        assert.equal(getterCalls, 0);
        assert.equal(wrapper.custom, wrapper);
        const derived = Object.create(wrapper);
        assert.equal(derived.custom, derived);
        assert.equal(getterCalls, 2);
        assert.deepEqual(implementation.namedCalls, []);
        delete prototype.custom;
        assert.equal(wrapper.custom, "named custom");
        Object.setPrototypeOf(wrapper, null);
        assert.equal(wrapper.length, "named length");
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
        assert.equal(wrapper.length, 0);
        assert.deepEqual(implementation.namedCalls, []);
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
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
        assert.equal(wrapper.length, 0);
        assert.deepEqual(calls, ["length"]);
      });

      test("does not inspect revoked prototype proxies for unsupported names", () => {
        const { globalObject, wrapper } = createLegacyPlatformObject("HTMLCollection", {});
        const { proxy, revoke } = Proxy.revocable(globalObject.HTMLCollection.prototype, {});
        Object.setPrototypeOf(wrapper, proxy);
        revoke();
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
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
        assert.equal(wrapper.length, 0);
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        assert.deepEqual(implementation.namedCalls, []);
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "missing"), undefined);
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
              assert.deepEqual(implementation.namedCalls, ["length"]);
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
        assert.equal(wrapper[0], "indexed value");
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "0").value, "indexed value");
        assert.equal(wrapper[1], undefined);
        assert.deepEqual(implementation.namedCalls, []);
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
        assert.equal(wrapper.length, 0);
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
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
        assert.equal(wrapper.length, 0);
        assert.deepEqual(implementation.namedCalls, []);
      });

      test("optimizes public constructors and separate supported-name checks", () => {
        const generated = require(path.resolve(outputDir, "NamedProperties.js"));
        const utils = require(path.resolve(outputDir, "utils.js"));
        const globalObject = vm.runInNewContext("globalThis");
        generated.install(globalObject, ["Window"]);
        const wrapper = new globalObject.NamedProperties();
        const implementation = utils.implForWrapper(wrapper);
        implementation.entries.set("length", "named length");
        assert.equal(wrapper.length, 1);
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
        assert.deepEqual(implementation.supportsCalls, []);
        assert.deepEqual(implementation.namedCalls, []);
        assert.equal(wrapper.namedItem("length"), "named length");
        assert.deepEqual(implementation.supportsCalls, []);
        assert.deepEqual(implementation.namedCalls, ["length"]);
        assert.equal(wrapper.missing, undefined);
        assert.deepEqual(implementation.supportsCalls, ["missing"]);
        assert.deepEqual(implementation.namedCalls, ["length"]);
        delete globalObject.NamedProperties.prototype.length;
        assert.equal(wrapper.length, "named length");
        assert.deepEqual(implementation.supportsCalls, ["missing", "length"]);
        assert.deepEqual(implementation.namedCalls, ["length", "length"]);
      });

      test("preserves lookups after changing to another realm's prototype", () => {
        const { wrapper } = createLegacyPlatformObject("HTMLCollection", { indexed: ["element"] });
        const { globalObject } = createLegacyPlatformObject("HTMLCollection", {});
        Object.setPrototypeOf(wrapper, globalObject.HTMLCollection.prototype);
        assert.equal(wrapper.length, 1);
        assert.equal(Object.getOwnPropertyDescriptor(wrapper, "length"), undefined);
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
        assert.equal(wrapper.inherited, "named property");

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
        assert.equal(wrapperWithOwnProperty.own, "own property");
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
    assert.equal(output, input);
  });
});
