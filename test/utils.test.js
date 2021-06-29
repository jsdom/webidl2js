"use strict";

const utils = require("../lib/output/utils");

describe("utils.js", () => {
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
        expect(utils.isObject(primitive)).toBe(false);
      });
    }

    test("bigint", () => {
      expect(utils.isObject(123n)).toBe(false);
    });

    test("object", () => {
      expect(utils.isObject({})).toBe(true);
    });

    test("function", () => {
      expect(utils.isObject(() => {})).toBe(true);
    });
  });

  describe("registerIntrinsic", () => {
    test("sets a value in the ctorRegistry", () => {
      const globalObject = { Array };
      const ctorRegistry = utils.initCtorRegistry(globalObject);
      expect(ctorRegistry["%AsyncIteratorPrototype%"]).toBe(utils.AsyncIteratorPrototype);
      const asyncIteratorPrototype = {};
      utils.registerIntrinsic(globalObject, "%AsyncIteratorPrototype%", asyncIteratorPrototype);
      expect(ctorRegistry["%AsyncIteratorPrototype%"]).toBe(asyncIteratorPrototype);
    });

    test("initializes the ctorRegistry if it doesn't exist", () => {
      const globalObject = { Array };
      utils.registerIntrinsic(globalObject, "%AsyncIteratorPrototype%", {});
      expect(globalObject[utils.ctorRegistrySymbol]).toBeDefined();
    });
  });

  describe("newObjectInRealm", () => {
    test("creates a new object in the given realm with the properties of the given object", () => {
      const realm = { Object: function Object() {}, Array };
      const object = utils.newObjectInRealm(realm, { foo: 42 });
      expect(object).toBeInstanceOf(realm.Object);
      expect(object).toEqual({ foo: 42 });
    });

    test("uses the captured intrinsic Object, not the current realm.Object", () => {
      const realm = { Object, Array };
      utils.initCtorRegistry(realm);
      realm.Object = function Object() {};
      const object = utils.newObjectInRealm(realm, {});
      expect(object).toBeInstanceOf(Object);
      expect(object).not.toBeInstanceOf(realm.Object);
    });
  });
});
