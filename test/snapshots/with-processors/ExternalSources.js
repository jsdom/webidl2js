"use strict";
const conversions = require("webidl-conversions");
const utils = require("./utils.js");
const installers = [
  (() => {
    const Impl = require("../implementations/ExternalSources.js");

    const interfaceName = "ExternalSources";
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
        first() {
          return Impl.implementation.first();
        }
      };
      for (const name of Reflect.ownKeys(additions)) {
        if (Object.hasOwn(target, name)) {
          throw new globalObject.TypeError(interfaceName + " already has a member named " + name);
        }
      }
      utils.define(target, additions);
    };
  })(),
  (() => {
    const Impl = require("../implementations/partial-sources/ExternalSources.js");

    const interfaceName = "ExternalSources";
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
        second() {
          return Impl.implementation.second();
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
