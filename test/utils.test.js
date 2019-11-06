// eslint-disable-next-line spaced-comment
/* eslint-env node, jest */
/* global BigInt */

"use strict";

const utils = require("../lib/output/utils");

describe("utils.js", () => {
  describe("isObject", () => {
    const BIG_INT_PLACEHOLDER = "BigInt placeholder";

    /** @type {Array<string | number | bigint | boolean | symbol | null | undefined>} */
    const primitives = [
      123,
      "string",
      Symbol.iterator,
      true,
      BIG_INT_PLACEHOLDER,
      null,
      undefined
    ];

    // eslint-disable-next-line new-cap, valid-typeof
    if (typeof BigInt === "function" && typeof BigInt("123") === "bigint") {
      primitives.splice(
        primitives.indexOf(BIG_INT_PLACEHOLDER),
        1,
        // eslint-disable-next-line new-cap
        BigInt("123")
      );
    }

    for (const primitive of primitives) {
      /** @type {"string" | "number" | "bigint" | "boolean" | "symbol" | "null" | "undefined"} */
      let type = primitive === null ? "null" : typeof primitive;

      let testPrimitive = test;

      if (primitive === BIG_INT_PLACEHOLDER) {
        // BigInt doesn't exist on Node 8, so we have to assign this manually:
        type = "bigint";
        testPrimitive = test.skip;
      }

      testPrimitive(type, () => {
        expect(utils.isObject(primitive)).toBe(false);
      });
    }

    test("object", () => {
      expect(utils.isObject({})).toBe(true);
    });

    test("function", () => {
      expect(utils.isObject(() => {})).toBe(true);
    });
  });
});
