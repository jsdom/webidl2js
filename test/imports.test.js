"use strict";

const { test } = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");
const Context = require("../lib/context.js");
const { RequiresMap } = require("../lib/utils.js");

test("named imports from different modules stay distinct when member imports are merged", () => {
  const ctx = new Context();
  const first = new RequiresMap(ctx);
  const second = new RequiresMap(ctx);
  const firstName = first.add("../first", "run");
  const secondName = second.add("../second", "run");
  const suffixedExport = "run_2";
  const suffixedName = second.add("../third", suffixedExport);
  assert.notStrictEqual(firstName, secondName);
  assert.notStrictEqual(secondName, suffixedName);
  assert.strictEqual(second.add("../first.js", "run"), firstName);

  first.merge(second);
  const modules = {
    "../first.js": { run: () => 1 },
    "../second.js": { run: () => 2 },
    "../third.js": { [suffixedExport]: () => 3 }
  };
  const result = vm.runInNewContext(`${first.generate()}
    [${firstName}(), ${secondName}(), ${suffixedName}()];`, {
    require: name => modules[name]
  });
  assert.deepStrictEqual(Array.from(result), [1, 2, 3]);
});

test("named import aliases do not shadow generated implementation locals", () => {
  const imports = new RequiresMap(new Context());
  const name = imports.add("../example", "impl");
  const result = vm.runInNewContext(`${imports.generate()}
    (() => { const $impl = 1; return ${name}() + $impl; })();`, {
    require: () => ({ impl: () => 2 })
  });
  assert.strictEqual(result, 3);
});

test("reinitializing a generation context resets import aliases", () => {
  const ctx = new Context();
  const first = new RequiresMap(ctx).add("../first", "run");
  new RequiresMap(ctx).add("../second", "run");
  ctx.initialize();
  assert.strictEqual(new RequiresMap(ctx).add("../second", "run"), first);
});

test("whole-module imports and named imports cannot reuse the same local name", () => {
  for (const namedFirst of [false, true]) {
    const imports = new RequiresMap(new Context());
    function addNamed() {
      return imports.add("../example", "run");
    }
    function addModule() {
      return imports.add("../$import_run");
    }
    const names = namedFirst ? [addNamed(), addModule()] : [addModule(), addNamed()];
    assert.notStrictEqual(names[0], names[1]);
    const result = vm.runInNewContext(`${imports.generate()}
      [${names[0]}(), ${names[1]}()];`, {
      require(name) {
        return name === "../example.js" ? { run: () => 1 } : () => 2;
      }
    });
    assert.deepStrictEqual(Array.from(result), namedFirst ? [1, 2] : [2, 1]);
  }
});
