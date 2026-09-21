"use strict";
const conversions = require("webidl-conversions");
const utils = require("./utils.js");
const installers = [
  (() => {
    const Impl = require("../implementations/ExternalCEReactions.js");

    const interfaceName = "ExternalCEReactions";
    const exposed = new Set(["Window"]);

    return (globalObject, globalNames) => {
      if (!globalNames.some(globalName => exposed.has(globalName))) {
        return;
      }
      const target = globalObject[interfaceName];
      if (typeof target !== "function") {
        throw new globalObject.TypeError(interfaceName + " must be installed before its partial interfaces");
      }
      const additions = {
        method() {
          return Impl.implementation.method(globalObject);
        },
        get value() {
          return Impl.implementation["value"];
        },
        set value(V) {
          V = conversions["long"](V, {
            context: "Failed to set the 'value' property on 'ExternalCEReactions': The provided value",
            globals: globalObject
          });

          Impl.implementation["value"] = V;
        }
      };
      for (const name of Reflect.ownKeys(additions)) {
        if (Object.hasOwn(target, name)) {
          throw new globalObject.TypeError(interfaceName + " already has a member named " + name);
        }
      }
      utils.define(target, additions);
    };
  })()
];
exports.install = (globalObject, globalNames) => {
  for (const install of installers) {
    install(globalObject, globalNames);
  }
};
