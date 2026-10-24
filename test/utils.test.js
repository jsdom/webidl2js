"use strict";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const { setTimeout: delay } = require("node:timers/promises");
const utils = require("../lib/output/utils");

describe("utils.js", () => {
  describe("wrapper associations", () => {
    test("returns null for missing associations and preserves unknown values in try helpers", () => {
      for (const value of [undefined, null, false, 0, 1n, "", {}, Symbol("value")]) {
        assert.strictEqual(utils.wrapperForImpl(value), null);
        assert.strictEqual(utils.implForWrapper(value), null);
        assert.strictEqual(utils.tryWrapperForImpl(value), value);
        assert.strictEqual(utils.tryImplForWrapper(value), value);
      }
    });

    test("rejects replacement of an existing implementation or interface brand", () => {
      const wrapper = {};
      const impl = {};
      const descriptor = utils.createInterfaceDescriptor();
      const otherDescriptor = utils.createInterfaceDescriptor();
      utils.registerWrapper(wrapper, impl, descriptor);
      assert.throws(() => utils.registerWrapper(wrapper, {}, otherDescriptor), TypeError);
      assert.strictEqual(utils.implForWrapper(wrapper), impl);
      assert.strictEqual(utils.implForWrapperWithInterface(wrapper, descriptor), impl);
      assert.strictEqual(utils.implForWrapperWithInterface(wrapper, otherDescriptor), null);
    });

    test("untyped lookup ignores extra callback arguments", () => {
      const wrapper = {};
      const impl = {};
      utils.registerWrapper(wrapper, impl, utils.createInterfaceDescriptor());
      assert.deepStrictEqual([{}, wrapper].map(utils.implForWrapper), [null, impl]);
    });
  });

  describe("isObject", () => {
    const primitives = [
      123,
      "string",
      Symbol.iterator,
      true,
      null,
      undefined
    ];

    for (const primitive of primitives) {
      test(primitive === null ? "null" : typeof primitive, () => {
        assert.strictEqual(utils.isObject(primitive), false);
      });
    }

    test("bigint", () => {
      assert.strictEqual(utils.isObject(123n), false);
    });

    test("object", () => {
      assert.strictEqual(utils.isObject({}), true);
    });

    test("function", () => {
      assert.strictEqual(utils.isObject(() => {}), true);
    });
  });

  describe("newObjectInRealm", () => {
    test("creates a new object in the given realm with the properties of the given object", () => {
      const realm = { Object: function Object() {}, Array };
      const object = utils.newObjectInRealm(realm, { foo: 42 });
      assert(object instanceof realm.Object);
      assert.deepStrictEqual({ ...object }, { foo: 42 });
    });

    test("uses the captured intrinsic Object, not the current realm.Object", () => {
      const realm = { Object, Array };
      utils.initCtorRegistry(realm);
      realm.Object = function Object() {};
      const object = utils.newObjectInRealm(realm, {});
      assert(object instanceof Object);
      assert(!(object instanceof realm.Object));
    });
  });

  describe("convertAsyncSequence", () => {
    const iterableFactories = [
      [
        "an array of values", () => {
          return ["a", "b"];
        }
      ],

      [
        "an array of promises", () => {
          return [
            Promise.resolve("a"),
            Promise.resolve("b")
          ];
        }
      ],

      [
        "an array iterator", () => {
          return ["a", "b"][Symbol.iterator]();
        }
      ],

      [
        "a Set", () => {
          return new Set(["a", "b"]);
        }
      ],

      [
        "a Set iterator", () => {
          return new Set(["a", "b"])[Symbol.iterator]();
        }
      ],

      [
        "a sync generator", () => {
          function* syncGenerator() {
            yield "a";
            yield "b";
          }

          return syncGenerator();
        }
      ],

      [
        "an async generator", () => {
          async function* asyncGenerator() {
            yield "a";
            yield "b";
          }

          return asyncGenerator();
        }
      ],

      [
        "a sync iterable of values", () => {
          const chunks = ["a", "b"];
          const iterator = {
            next() {
              return {
                done: chunks.length === 0,
                value: chunks.shift()
              };
            }
          };
          const iterable = {
            [Symbol.iterator]: () => iterator
          };
          return iterable;
        }
      ],

      [
        "a sync iterable of promises", () => {
          const chunks = ["a", "b"];
          const iterator = {
            next() {
              return chunks.length === 0 ?
                { done: true } :
                {
                  done: false,
                  value: Promise.resolve(chunks.shift())
                };
            }
          };
          const iterable = {
            [Symbol.iterator]: () => iterator
          };
          return iterable;
        }
      ],

      [
        "an async iterable", () => {
          const chunks = ["a", "b"];
          const asyncIterator = {
            next() {
              return Promise.resolve({
                done: chunks.length === 0,
                value: chunks.shift()
              });
            }
          };
          const asyncIterable = {
            [Symbol.asyncIterator]: () => asyncIterator
          };
          return asyncIterable;
        }
      ]
    ];

    for (const [label, factory] of iterableFactories) {
      test(`accepts ${label}`, async () => {
        const iterable = factory();
        const isAsync = label.includes("async");
        const asyncSequence = utils.convertAsyncSequence(iterable, x => x);

        assert.strictEqual(asyncSequence.object, iterable);
        assert.strictEqual(asyncSequence.method, isAsync ? iterable[Symbol.asyncIterator] : iterable[Symbol.iterator]);
        assert.strictEqual(asyncSequence.type, isAsync ? "async" : "sync");
        assert.strictEqual(utils.wrapperForImpl(asyncSequence), iterable);

        const iterator = asyncSequence[Symbol.asyncIterator]();
        assert.deepStrictEqual(await iterator.next(), { done: false, value: "a" });
        assert.deepStrictEqual(await iterator.next(), { done: false, value: "b" });
        assert.deepStrictEqual(await iterator.next(), { done: true, value: undefined });
      });
    }

    const badIterables = [
      ["null", null],
      ["undefined", undefined],
      ["0", 0],
      ["NaN", NaN],
      ["true", true],
      ["{}", {}],
      ["Object.create(null)", Object.create(null)],
      ["a function", () => 42],
      ["a symbol", Symbol("foo")],
      ["a string", "ab"],
      [
        "an object with a non-callable @@iterator method", {
          [Symbol.iterator]: 42
        }
      ],
      [
        "an object with a non-callable @@asyncIterator method", {
          [Symbol.asyncIterator]: 42
        }
      ]
    ];

    for (const [label, iterable] of badIterables) {
      test(`throws on invalid iterables; specifically ${label}`, () => {
        assert.throws(() => {
          utils.convertAsyncSequence(iterable, x => x);
        }, TypeError);
      });
    }

    const badIteratorMethods = [
      [
        "an object with an @@iterator method returning a non-object", {
          [Symbol.iterator]: () => 42
        }
      ],
      [
        "an object with an @@asyncIterator method returning a non-object", {
          [Symbol.asyncIterator]: () => 42
        }
      ]
    ];

    for (const [label, iterable] of badIteratorMethods) {
      test(`throws when opening iterables with bad iterator methods; specifically ${label}`, () => {
        const asyncSequence = utils.convertAsyncSequence(iterable, x => x);
        assert.throws(() => {
          asyncSequence[Symbol.asyncIterator]();
        }, TypeError);
      });
    }
  });

  describe("safePromiseResolve", () => {
    function safelyResolve(value) {
      return new Promise(resolve => {
        utils.safePromiseResolve(resolve, value);
      });
    }

    // Whether the promise settles before a microtask that is queued right after this is called.
    async function settlesWithoutDeferral(promise) {
      const log = [];
      promise.then(() => log.push("settled"), () => log.push("settled"));
      Promise.resolve().then(() => log.push("microtask"));
      await delay(0);
      return log[0] === "settled";
    }

    test("fulfills with a primitive without deferring", async () => {
      await Promise.all([undefined, null, false, 0, 1n, "", Symbol("value")].map(async value => {
        const promise = safelyResolve(value);
        assert.strictEqual(await settlesWithoutDeferral(promise), true);
        assert.strictEqual(await promise, value);
      }));
    });

    test("fulfills with an object without a then property without deferring", async () => {
      const value = {};
      const promise = safelyResolve(value);
      assert.strictEqual(await settlesWithoutDeferral(promise), true);
      assert.strictEqual(await promise, value);
    });

    test("does not defer for a then data property that shadows a getter further up the prototype chain", async () => {
      const value = Object.create({
        get then() {
          throw new Error("The getter should not be called.");
        }
      });
      Object.defineProperty(value, "then", { value: undefined });
      const promise = safelyResolve(value);
      assert.strictEqual(await settlesWithoutDeferral(promise), true);
      assert.strictEqual(await promise, value);
    });

    test("does not defer for a then accessor without a getter", async () => {
      const value = {};
      // eslint-disable-next-line accessor-pairs -- A setter without a getter is what this tests.
      Object.defineProperty(value, "then", { set() {} });
      const promise = safelyResolve(value);
      assert.strictEqual(await settlesWithoutDeferral(promise), true);
      assert.strictEqual(await promise, value);
    });

    for (const [description, createValue] of [
      [
        "an own then getter", log => {
          return {
            get then() {
              log.push("get then");
              return undefined;
            }
          };
        }
      ],
      [
        "a then getter further up the prototype chain", log => {
          return Object.create(Object.create({
            get then() {
              log.push("get then");
              return undefined;
            }
          }));
        }
      ]
    ]) {
      test(`does not run ${description} synchronously`, async () => {
        const log = [];
        const value = createValue(log);
        const promise = safelyResolve(value);
        assert.deepStrictEqual(log, []);
        assert.strictEqual(await settlesWithoutDeferral(promise), false);
        assert.strictEqual(await promise, value);
        assert.ok(log.includes("get then"));
      });
    }

    test("adopts the function returned by a then getter, without running the getter synchronously", async () => {
      const log = [];
      const value = {
        get then() {
          log.push("get then");
          return resolve => resolve("adopted");
        }
      };
      const promise = safelyResolve(value);
      assert.deepStrictEqual(log, []);
      assert.strictEqual(await promise, "adopted");
      assert.deepStrictEqual(log, ["get then"]);
    });

    test("calls the function returned by a then getter on the same tick as ordinary resolution", async () => {
      const log = [];
      safelyResolve({
        get then() {
          return () => log.push("deferred");
        }
      });
      Promise.resolve({ then: () => log.push("ordinary") });
      await delay(0);
      assert.deepStrictEqual(log, ["deferred", "ordinary"]);
    });

    test("rejects with the error thrown by a then getter, without throwing synchronously", async () => {
      const error = new Error("then getter");
      const promise = safelyResolve({
        get then() {
          throw error;
        }
      });
      await assert.rejects(promise, e => e === error);
    });

    test("rejects with the error thrown by the function returned by a then getter", async () => {
      const error = new Error("then function");
      const promise = safelyResolve({
        get then() {
          return () => {
            throw error;
          };
        }
      });
      await assert.rejects(promise, e => e === error);
    });

    test("ignores an error thrown by the function returned by a then getter after it resolved", async () => {
      const promise = safelyResolve({
        get then() {
          return resolve => {
            resolve("adopted");
            throw new Error("This error should be ignored.");
          };
        }
      });
      assert.strictEqual(await promise, "adopted");
    });

    test("adopts a thenable with a then method", async () => {
      assert.strictEqual(await safelyResolve({ then: resolve => resolve("adopted") }), "adopted");
    });

    test("rejects with the error thrown by a then method", async () => {
      const error = new Error("then method");
      await assert.rejects(safelyResolve({
        then() {
          throw error;
        }
      }), e => e === error);
    });

    test("adopts a promise", async () => {
      assert.strictEqual(await safelyResolve(Promise.resolve("adopted")), "adopted");
    });
  });
});
