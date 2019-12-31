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

    const testBigInt = typeof BigInt === "function" && typeof BigInt("123") === "bigint" ? test : test.skip;

    testBigInt("bigint", () => {
      expect(utils.isObject(BigInt(123))).toBe(false);
    });

    test("object", () => {
      expect(utils.isObject({})).toBe(true);
    });

    test("function", () => {
      expect(utils.isObject(() => {})).toBe(true);
    });
  });
});
