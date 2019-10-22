// eslint-disable-next-line spaced-comment
/* eslint-env node, jest */
/* global BigInt */

"use strict";

const utils = require("../lib/output/utils");

describe("utils.js", () => {
  describe("importStar", () => {
    test("importStar works on non-ES2015 modules", () => {
      const exports = class Foo {
        static doStuff() {
          return "success";
        }
      };

      exports.init = function (instance, privateData) {
        instance._privateData = privateData;
      };

      const Impl = utils.importStar(exports);

      expect(Impl).not.toBe(exports);
      expect(Impl).not.toHaveProperty("prototype");
      expect(Impl).not.toHaveProperty("doStuff");
      expect(Impl).toHaveProperty("default");
      expect(Impl).toHaveProperty("init");
      expect(Impl).not.toHaveProperty("__esModule");

      expect(Impl.default).toBe(exports);
      expect(Impl.init).toBe(exports.init);
    });

    test("importStar works on ES2015 modules", () => {
      const module = {};
      Object.defineProperty(module, "__esModule", { value: true });

      module.default = class Foo {
        static doStuff() {
          return "success";
        }
      };

      module.init = function (instance, privateData) {
        instance._privateData = privateData;
      };

      const Impl = utils.importStar(module);

      expect(Impl).toBe(module);
      expect(Impl).toHaveProperty("default");
      expect(Impl).toHaveProperty("init");
      expect(Impl).toHaveProperty("__esModule");
    });

    test("importStar caches the result for Object types", () => {
      const exports = class Foo {
        static doStuff() {
          return "success";
        }
      };

      const Impl1 = utils.importStar(exports);
      const Impl2 = utils.importStar(exports);

      expect(Impl1).toBe(Impl2);
    });

    test("importStar doesn't cache the result for primitive values", () => {
      const exports = 12345;

      const Impl1 = utils.importStar(exports);
      const Impl2 = utils.importStar(exports);

      expect(Impl1).not.toBe(Impl2);
      expect(Impl1.default).toBe(Impl2.default);
    });

    describe("importStar works on primitive values:", () => {
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
          const Impl = utils.importStar(primitive);

          expect(Impl).toEqual(expect.anything());
          expect(Impl).toHaveProperty("default");
          expect(typeof Impl.default).toEqual(typeof primitive);
          expect(Impl.default).toEqual(primitive);
        });
      }
    });
  });
});
