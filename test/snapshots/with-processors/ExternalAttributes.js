"use strict";
const conversions = require("webidl-conversions");
const utils = require("./utils.js");
const installers = [
  (() => {
    const Impl = require("../implementations/ExternalAttributes.js");

    const interfaceName = "ExternalAttributes";
    const exposed = new Set(["Window"]);
    const BrandCheck = require("./BrandCheck.js");

    return (globalObject, globalNames) => {
      if (!globalNames.some(globalName => exposed.has(globalName))) {
        return;
      }
      const target = globalObject[interfaceName];
      if (typeof target !== "function") {
        throw new globalObject.TypeError(interfaceName + " must be installed before its partial interfaces");
      }
      const additions = {
        get label() {
          return Impl.implementation["label"];
        },
        set label(V) {
          V = conversions["DOMString"](V, {
            context: "Failed to set the 'label' property on 'ExternalAttributes': The provided value",
            globals: globalObject
          });

          Impl.implementation["label"] = V;
        },
        get answer() {
          return Impl.implementation["answer"];
        },
        get payload() {
          return utils.tryWrapperForImpl(Impl.implementation["payload"]);
        },
        set payload(V) {
          V = BrandCheck.convert(globalObject, V, {
            context: "Failed to set the 'payload' property on 'ExternalAttributes': The provided value"
          });

          Impl.implementation["payload"] = V;
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
