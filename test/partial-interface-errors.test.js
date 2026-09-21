"use strict";

const { describe, test } = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");
const Transformer = require("..");

const outputDir = path.resolve(__dirname, "output");

describe("external partial interface errors", () => {
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
});
