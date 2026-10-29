"use strict";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const utils = require("../lib/output/utils");

describe("utils.js", () => {
  describe("wrapper associations", () => {
    test("returns null for missing associations and preserves unknown values in try helpers", () => {
      for (const value of [undefined, null, false, 0, 1n, "", {}, Symbol("value")]) {
        assert.equal(utils.wrapperForImpl(value), null);
        assert.equal(utils.implForWrapper(value), null);
        assert.equal(utils.tryWrapperForImpl(value), value);
        assert.equal(utils.tryImplForWrapper(value), value);
      }
    });

    test("rejects replacement of an existing implementation or interface brand", () => {
      const wrapper = {};
      const impl = {};
      const descriptor = utils.createInterfaceDescriptor();
      const otherDescriptor = utils.createInterfaceDescriptor();
      utils.registerWrapper(wrapper, impl, descriptor);
      assert.throws(() => utils.registerWrapper(wrapper, {}, otherDescriptor), TypeError);
      assert.equal(utils.implForWrapper(wrapper), impl);
      assert.equal(utils.implForWrapperWithInterface(wrapper, descriptor), impl);
      assert.equal(utils.implForWrapperWithInterface(wrapper, otherDescriptor), null);
    });

    test("untyped lookup ignores extra callback arguments", () => {
      const wrapper = {};
      const impl = {};
      utils.registerWrapper(wrapper, impl, utils.createInterfaceDescriptor());
      assert.deepEqual([{}, wrapper].map(utils.implForWrapper), [null, impl]);
    });
  });

  describe("isObject", () => {
    const primitives = [123, "string", Symbol.iterator, true, null, undefined];

    for (const primitive of primitives) {
      test(primitive === null ? "null" : typeof primitive, () => {
        assert.equal(utils.isObject(primitive), false);
      });
    }

    test("bigint", () => {
      assert.equal(utils.isObject(123n), false);
    });

    test("object", () => {
      assert.equal(utils.isObject({}), true);
    });

    test("function", () => {
      assert.equal(
        utils.isObject(() => {}),
        true,
      );
    });
  });

  describe("newObjectInRealm", () => {
    test("creates a new object in the given realm with the properties of the given object", () => {
      const realm = { Object: function Object() {}, Array };
      const object = utils.newObjectInRealm(realm, { foo: 42 });
      assert(object instanceof realm.Object);
      assert.deepEqual({ ...object }, { foo: 42 });
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
        "an array of values",
        () => {
          return ["a", "b"];
        },
      ],

      [
        "an array of promises",
        () => {
          return [Promise.resolve("a"), Promise.resolve("b")];
        },
      ],

      [
        "an array iterator",
        () => {
          return ["a", "b"][Symbol.iterator]();
        },
      ],

      [
        "a Set",
        () => {
          return new Set(["a", "b"]);
        },
      ],

      [
        "a Set iterator",
        () => {
          return new Set(["a", "b"])[Symbol.iterator]();
        },
      ],

      [
        "a sync generator",
        () => {
          function* syncGenerator() {
            yield "a";
            yield "b";
          }

          return syncGenerator();
        },
      ],

      [
        "an async generator",
        () => {
          async function* asyncGenerator() {
            yield "a";
            yield "b";
          }

          return asyncGenerator();
        },
      ],

      [
        "a sync iterable of values",
        () => {
          const chunks = ["a", "b"];
          const iterator = {
            next() {
              return {
                done: chunks.length === 0,
                value: chunks.shift(),
              };
            },
          };
          const iterable = {
            [Symbol.iterator]: () => iterator,
          };
          return iterable;
        },
      ],

      [
        "a sync iterable of promises",
        () => {
          const chunks = ["a", "b"];
          const iterator = {
            next() {
              return chunks.length === 0
                ? { done: true }
                : {
                    done: false,
                    value: Promise.resolve(chunks.shift()),
                  };
            },
          };
          const iterable = {
            [Symbol.iterator]: () => iterator,
          };
          return iterable;
        },
      ],

      [
        "an async iterable",
        () => {
          const chunks = ["a", "b"];
          const asyncIterator = {
            next() {
              return Promise.resolve({
                done: chunks.length === 0,
                value: chunks.shift(),
              });
            },
          };
          const asyncIterable = {
            [Symbol.asyncIterator]: () => asyncIterator,
          };
          return asyncIterable;
        },
      ],
    ];

    for (const [label, factory] of iterableFactories) {
      test(`accepts ${label}`, async () => {
        const iterable = factory();
        const isAsync = label.includes("async");
        const asyncSequence = utils.convertAsyncSequence(iterable, (x) => x);

        assert.equal(asyncSequence.object, iterable);
        assert.equal(
          asyncSequence.method,
          isAsync ? iterable[Symbol.asyncIterator] : iterable[Symbol.iterator],
        );
        assert.equal(asyncSequence.type, isAsync ? "async" : "sync");
        assert.equal(utils.wrapperForImpl(asyncSequence), iterable);

        const iterator = asyncSequence[Symbol.asyncIterator]();
        assert.deepEqual(await iterator.next(), { done: false, value: "a" });
        assert.deepEqual(await iterator.next(), { done: false, value: "b" });
        assert.deepEqual(await iterator.next(), { done: true, value: undefined });
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
        "an object with a non-callable @@iterator method",
        {
          [Symbol.iterator]: 42,
        },
      ],
      [
        "an object with a non-callable @@asyncIterator method",
        {
          [Symbol.asyncIterator]: 42,
        },
      ],
    ];

    for (const [label, iterable] of badIterables) {
      test(`throws on invalid iterables; specifically ${label}`, () => {
        assert.throws(() => {
          utils.convertAsyncSequence(iterable, (x) => x);
        }, TypeError);
      });
    }

    const badIteratorMethods = [
      [
        "an object with an @@iterator method returning a non-object",
        {
          [Symbol.iterator]: () => 42,
        },
      ],
      [
        "an object with an @@asyncIterator method returning a non-object",
        {
          [Symbol.asyncIterator]: () => 42,
        },
      ],
    ];

    for (const [label, iterable] of badIteratorMethods) {
      test(`throws when opening iterables with bad iterator methods; specifically ${label}`, () => {
        const asyncSequence = utils.convertAsyncSequence(iterable, (x) => x);
        assert.throws(() => {
          asyncSequence[Symbol.asyncIterator]();
        }, TypeError);
      });
    }
  });
});
