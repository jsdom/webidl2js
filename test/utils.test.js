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

  describe("registerConstructor", () => {
    test("sets a value in the ctorRegistry", () => {
      const globalObject = { Array };
      const ctorRegistry = utils.initCtorRegistry(globalObject);
      expect(ctorRegistry["%AsyncIteratorPrototype%"]).toBe(utils.AsyncIteratorPrototype);
      const asyncIteratorPrototype = {};
      utils.registerConstructor(globalObject, "%AsyncIteratorPrototype%", asyncIteratorPrototype);
      expect(ctorRegistry["%AsyncIteratorPrototype%"]).toBe(asyncIteratorPrototype);
    });

    test("initializes the ctorRegistry if it doesn't exist", () => {
      const globalObject = { Array };
      utils.registerConstructor(globalObject, "%AsyncIteratorPrototype%", {});
      expect(globalObject[utils.ctorRegistrySymbol]).toBeDefined();
    });
  });
});
