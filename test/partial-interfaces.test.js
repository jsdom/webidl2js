"use strict";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs/promises");
const path = require("node:path");
const vm = require("node:vm");
const Transformer = require("..");

const outputDir = path.resolve(__dirname, "output");

async function generate(t, idl, implementations, options = {}) {
  await fs.mkdir(outputDir, { recursive: true });
  const directory = await fs.mkdtemp(path.join(outputDir, "partials-"));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  const idlPath = path.join(directory, "input.webidl");
  await fs.writeFile(idlPath, idl);
  await Promise.all(Object.entries(implementations).map(([name, source]) => fs.writeFile(path.join(directory, `${name}-impl.js`), source)));
  const transformer = new Transformer({ implSuffix: "-impl", ...options });
  transformer.addSource(idlPath, directory);
  await transformer.generate(directory);
  return name => require(path.join(directory, `${name}.js`));
}

async function fixture(t) {
  const base = await generate(t, `
    [Exposed=(Window,Worker)] interface Example {
      constructor();
      [WebIDL2JSCallWithGlobal] static any create();
      readonly attribute DOMString value;
    };
  `, {
    Example: `exports.implementation = class {
      get value() { return "base"; }
      static create(globalObject) { return require("./Example.js").create(globalObject); }
    };`
  });
  const partial = await generate(t, `
    [Exposed=(Window,Worker)] interface Payload { constructor(); };
    [Exposed=Window] partial interface Example {
      [WebIDL2JSCallWithGlobal] static any currentGlobal();
      static DOMString stringify(DOMString value);
      static DOMString choose(DOMString value);
      static DOMString choose(long value);
      static any unwrap(Payload value);
      static Promise<undefined> promise(DOMString value);
      static attribute DOMString label;
      static readonly attribute long answer;
    };
    [Exposed=Worker] partial interface Example {
      static DOMString workerOnly();
    };
  `, {
    Payload: "exports.implementation = class {};",
    Example: `exports.implementation = class {
      static currentGlobal(globalObject) { return globalObject; }
      static stringify(value) { return value; }
      static choose(value) { return typeof value; }
      static unwrap(value) { return { value }; }
      static promise() { return Promise.resolve(); }
      static get label() { return this._label; }
      static set label(value) { this._label = value; }
      static get answer() { return 42; }
      static workerOnly() { return "worker"; }
    };`
  }, { externalInterfaces: ["Example"] });
  return { base, partial };
}

describe("external partial interfaces", () => {
  test("extends an independently generated constructor without replacing its identity or registry", async t => {
    const { base, partial } = await fixture(t);
    const globalObject = vm.runInNewContext("globalThis");
    base("Example").install(globalObject, ["Window"]);
    const constructor = globalObject.Example;
    const { prototype } = constructor;
    const instance = new constructor();
    const registry = globalObject[base("utils").ctorRegistrySymbol];
    const registryDescriptors = Object.getOwnPropertyDescriptors(registry);
    const prototypeDescriptors = Object.getOwnPropertyDescriptors(prototype);

    partial("Example").install(globalObject, ["Window"]);

    assert.strictEqual(globalObject.Example, constructor);
    assert.strictEqual(constructor.prototype, prototype);
    assert.deepStrictEqual(Reflect.ownKeys(prototype), Reflect.ownKeys(prototypeDescriptors));
    for (const key of Reflect.ownKeys(prototypeDescriptors)) {
      assert.deepStrictEqual(Object.getOwnPropertyDescriptor(prototype, key), prototypeDescriptors[key]);
    }
    assert.deepStrictEqual(Object.getOwnPropertyDescriptors(registry), registryDescriptors);
    assert.strictEqual(instance.value, "base");
    assert.strictEqual(instance.constructor, constructor);
    assert.strictEqual(Object.getPrototypeOf(constructor.create()), prototype);
    assert.strictEqual(base("Example").is(constructor.create()), true);
    assert.deepStrictEqual(Object.keys(partial("Example")), ["install"]);
  });

  test("preserves conversions, overloads, and method descriptors", async t => {
    const { base, partial } = await fixture(t);
    const globalObject = vm.runInNewContext("globalThis");
    base("Example").install(globalObject, ["Window"]);
    partial("Payload").install(globalObject, ["Window"]);
    partial("Example").install(globalObject, ["Window"]);
    const { Example } = globalObject;
    assert.strictEqual(Example.stringify(42), "42");
    assert.strictEqual(Example.choose(42), "number");
    assert.strictEqual(Example.choose("42"), "string");
    assert.throws(() => Example.stringify(), globalObject.TypeError);
    assert.throws(() => Example.stringify(Symbol("invalid")), globalObject.TypeError);
    assert.throws(() => Reflect.construct(Example.stringify, ["test"]), TypeError);
    assert.deepStrictEqual(Object.getOwnPropertyDescriptor(Example, "stringify"), {
      value: Example.stringify, writable: true, enumerable: true, configurable: true
    });
    assert.strictEqual(Example.stringify.name, "stringify");
    assert.strictEqual(Example.stringify.length, 1);
    const payload = new globalObject.Payload();
    assert.strictEqual(Example.unwrap(payload).value, partial("Payload").convert(globalObject, payload));
    assert.throws(() => Example.unwrap(Object.create(globalObject.Payload.prototype)), globalObject.TypeError);
  });

  test("installs static attribute accessors with conversions and readonly descriptors", async t => {
    const { base, partial } = await fixture(t);
    const globalObject = vm.runInNewContext("globalThis");
    base("Example").install(globalObject, ["Window"]);
    partial("Example").install(globalObject, ["Window"]);
    const { Example } = globalObject;
    Example.label = 123;
    assert.strictEqual(Example.label, "123");
    assert.throws(() => {
      Example.label = Symbol("invalid");
    }, globalObject.TypeError);
    assert.strictEqual(Example.answer, 42);
    const descriptor = Object.getOwnPropertyDescriptor(Example, "answer");
    assert.strictEqual(descriptor.enumerable, true);
    assert.strictEqual(descriptor.configurable, true);
    assert.strictEqual(descriptor.set, undefined);
    assert.strictEqual(descriptor.get.name, "get answer");
    assert.strictEqual(descriptor.get.length, 0);
  });

  test("captures each installation's global for detached calls, exceptions, and promise rejection", async t => {
    const { base, partial } = await fixture(t);
    const first = vm.runInNewContext("globalThis");
    const second = vm.runInNewContext("globalThis");
    for (const globalObject of [first, second]) {
      base("Example").install(globalObject, ["Window"]);
      partial("Payload").install(globalObject, ["Window"]);
      partial("Example").install(globalObject, ["Window"]);
    }
    assert.notStrictEqual(first.Example.stringify, second.Example.stringify);
    const { currentGlobal, stringify, promise } = first.Example;
    assert.strictEqual(currentGlobal.call(second.Example), first);
    assert.throws(() => stringify.call(second.Example, Symbol("invalid")), first.TypeError);
    const rejection = promise(Symbol("invalid"));
    assert(rejection instanceof first.Promise);
    await assert.rejects(rejection, first.TypeError);
    const payload = new second.Payload();
    assert.strictEqual(first.Example.unwrap(payload).value, partial("Payload").convert(second, payload));
  });

  test("honors each partial's exposure and works without a webidl2js constructor registry", async t => {
    const { partial } = await fixture(t);
    const globalObject = vm.runInNewContext("globalThis");
    partial("Example").install(globalObject, ["Other"]);
    assert.strictEqual(globalObject.Example, undefined);
    globalObject.Example = class Example {};
    partial("Example").install(globalObject, ["Worker"]);
    assert.strictEqual(globalObject.Example.workerOnly(), "worker");
    assert.strictEqual(globalObject.Example.stringify, undefined);
    assert.strictEqual(globalObject[partial("utils").ctorRegistrySymbol], undefined);
  });

  test("fails when the constructor is missing or a member would overwrite an existing property", async t => {
    const { base, partial } = await fixture(t);
    const globalObject = vm.runInNewContext("globalThis");
    for (const target of [undefined, {}]) {
      globalObject.Example = target;
      assert.throws(
        () => partial("Example").install(globalObject, ["Window"]),
        /Example must be installed before its partial interfaces/
      );
    }
    base("Example").install(globalObject, ["Window"]);
    globalObject.Example.stringify = "existing";
    assert.throws(() => partial("Example").install(globalObject, ["Window"]), /already has a member named stringify/);
    assert.strictEqual(globalObject.Example.stringify, "existing");
    assert.strictEqual(globalObject.Example.currentGlobal, undefined);
  });

  const unsupported = [
    ["instance operation", "[Exposed=Window] partial interface Example { undefined method(); };", /only static/],
    ["instance attribute", "[Exposed=Window] partial interface Example { attribute DOMString value; };", /only static/],
    ["constant", "[Exposed=Window] partial interface Example { const long VALUE = 1; };", /only static/],
    ["stringifier", "[Exposed=Window] partial interface Example { stringifier; };", /only static/],
    ["missing exposure", "partial interface Example { static undefined method(); };", /lacks \[Exposed\]/],
    ["secure context", "[Exposed=Window, SecureContext] partial interface Example {};", /SecureContext.*not supported/],
    [
      "member exposure",
      "[Exposed=Window] partial interface Example { [Exposed=Window] static undefined f(); };",
      /Exposed.*not supported/
    ],
    [
      "unforgeable",
      "[Exposed=Window] partial interface Example { [LegacyUnforgeable] static undefined f(); };",
      /LegacyUnforgeable.*not supported/
    ],
    [
      "same object",
      "[Exposed=Window] partial interface Example { [SameObject] static readonly attribute object v; };",
      /SameObject.*not supported/
    ],
    ["full definition", "[Exposed=Window] interface Example {};", /external interface Example.*defined/],
    ["inheritance", "[Exposed=Window] interface Child : Example {};", /inherit.*external interface Example/],
    ["includes", "interface mixin M {}; Example includes M;", /includes.*external interface Example/],
    [
      "external argument",
      "[Exposed=Window] partial interface Example { static undefined f(sequence<Example> v); };",
      /external interface Example.*type/
    ],
    [
      "external return",
      "[Exposed=Window] partial interface Example { static Example f(); };",
      /external interface Example.*type/
    ],
    ["typedef", "typedef Example Alias;", /external interface Example.*type/],
    [
      "duplicate attribute", "[Exposed=Window] partial interface Example { static attribute long x; " +
      "static attribute long x; };", /Duplicate.*x/
    ],
    [
      "overload across partials", "[Exposed=Window] partial interface Example { static undefined f(); }; " +
      "[Exposed=Window] partial interface Example { static undefined f(long v); };", /Duplicate.*f/
    ]
  ];

  for (const [name, idl, expected] of unsupported) {
    test(`rejects ${name}, including with suppressErrors`, () => {
      for (const suppressErrors of [false, true]) {
        const transformer = new Transformer({ externalInterfaces: ["Example"], suppressErrors });
        assert.throws(() => transformer._parse(outputDir, [{ idlContent: idl, impl: outputDir }]), expected);
      }
    });
  }

  test("requires explicit opt-in for external partials", () => {
    const transformer = new Transformer();
    assert.throws(() => transformer._parse(outputDir, [
      {
        idlContent: "[Exposed=Window] partial interface Example { static undefined f(); };", impl: outputDir
      }
    ]), /externalInterfaces/);
  });

  test("validates the externalInterfaces option", () => {
    for (const externalInterfaces of [null, "Example", [42]]) {
      assert.throws(() => new Transformer({ externalInterfaces }), /array of interface names/);
    }
  });

  test("uses the implementation directory of each partial's source", async t => {
    await fs.mkdir(outputDir, { recursive: true });
    const directory = await fs.mkdtemp(path.join(outputDir, "partials-"));
    t.after(() => fs.rm(directory, { recursive: true, force: true }));
    const transformer = new Transformer({ externalInterfaces: ["Example"], implSuffix: "-impl" });
    await Promise.all(["first", "second"].map(async name => {
      const sourceDir = path.join(directory, name);
      await fs.mkdir(sourceDir);
      const idlPath = path.join(sourceDir, "Example.webidl");
      await fs.writeFile(idlPath, `[Exposed=Window] partial interface Example { static DOMString ${name}(); };`);
      await fs.writeFile(
        path.join(sourceDir, "Example-impl.js"),
        `exports.implementation = class { static ${name}() { return "${name}"; } };`
      );
      transformer.addSource(idlPath, sourceDir);
    }));
    await transformer.generate(directory);
    const globalObject = vm.runInNewContext("globalThis");
    globalObject.Example = class Example {};
    require(path.join(directory, "Example.js")).install(globalObject, ["Window"]);
    assert.strictEqual(globalObject.Example.first(), "first");
    assert.strictEqual(globalObject.Example.second(), "second");
  });

  test("applies CEReactions processors to static members", async t => {
    const generated = await generate(t, `
      [Exposed=Window] partial interface Example {
        [CEReactions, WebIDL2JSCallWithGlobal] static any method();
        [CEReactions] static attribute long value;
      };
    `, {
      Example: `exports.implementation = class {
        static method(globalObject) { return globalObject; }
        static get value() { return 1; }
        static set value(value) { this._value = value; }
      };`
    }, {
      externalInterfaces: ["Example"],
      processCEReactions(code) {
        return `globalObject.reactions.push(interfaceName); ${code}`;
      }
    });
    const globalObject = vm.runInNewContext("globalThis");
    globalObject.Example = class Example {};
    globalObject.reactions = [];
    generated("Example").install(globalObject, ["Window"]);
    assert.strictEqual(globalObject.Example.method(), globalObject);
    assert.strictEqual(globalObject.Example.value, 1);
    globalObject.Example.value = 2;
    assert.deepStrictEqual(globalObject.reactions, ["Example", "Example", "Example"]);
  });

  test("continues merging partials into locally generated interfaces", async t => {
    const generated = await generate(t, `
      [Exposed=Window] interface Local { constructor(); };
      partial interface Local { static DOMString extra(); };
    `, { Local: "exports.implementation = class { static extra() { return 'extra'; } };" });
    const globalObject = vm.runInNewContext("globalThis");
    generated("Local").install(globalObject, ["Window"]);
    assert.strictEqual(globalObject.Local.extra(), "extra");
    assert.strictEqual(generated("Local").is(new globalObject.Local()), true);
  });
});
