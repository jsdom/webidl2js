"use strict";
const conversions = require("webidl-conversions");
const utils = require("./utils.js");
const installers = [
  (() => {
    const Impl = require("../implementations/ExternalOperations.js");

    const interfaceName = "ExternalOperations";
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
        currentGlobal() {
          return Impl.implementation.currentGlobal(globalObject);
        },
        stringify(value) {
          if (arguments.length < 1) {
            throw new globalObject.TypeError(
              `Failed to execute 'stringify' on 'ExternalOperations': 1 argument required, but only ${arguments.length} present.`
            );
          }
          const args = [];
          {
            let curArg = arguments[0];
            curArg = conversions["DOMString"](curArg, {
              context: "Failed to execute 'stringify' on 'ExternalOperations': parameter 1",
              globals: globalObject
            });
            args.push(curArg);
          }
          return Impl.implementation.stringify(...args);
        },
        choose(value) {
          if (arguments.length < 1) {
            throw new globalObject.TypeError(
              `Failed to execute 'choose' on 'ExternalOperations': 1 argument required, but only ${arguments.length} present.`
            );
          }
          const args = [];
          {
            let curArg = arguments[0];
            if (typeof curArg === "number") {
              {
                let curArg = arguments[0];
                curArg = conversions["long"](curArg, {
                  context: "Failed to execute 'choose' on 'ExternalOperations': parameter 1",
                  globals: globalObject
                });
                args.push(curArg);
              }
            } else {
              {
                let curArg = arguments[0];
                curArg = conversions["DOMString"](curArg, {
                  context: "Failed to execute 'choose' on 'ExternalOperations': parameter 1",
                  globals: globalObject
                });
                args.push(curArg);
              }
            }
          }
          return Impl.implementation.choose(...args);
        },
        unwrap(value) {
          if (arguments.length < 1) {
            throw new globalObject.TypeError(
              `Failed to execute 'unwrap' on 'ExternalOperations': 1 argument required, but only ${arguments.length} present.`
            );
          }
          const args = [];
          {
            let curArg = arguments[0];
            curArg = BrandCheck.convert(globalObject, curArg, {
              context: "Failed to execute 'unwrap' on 'ExternalOperations': parameter 1"
            });
            args.push(curArg);
          }
          return Impl.implementation.unwrap(...args);
        },
        promise(value) {
          try {
            if (arguments.length < 1) {
              throw new globalObject.TypeError(
                `Failed to execute 'promise' on 'ExternalOperations': 1 argument required, but only ${arguments.length} present.`
              );
            }
            const args = [];
            {
              let curArg = arguments[0];
              curArg = conversions["DOMString"](curArg, {
                context: "Failed to execute 'promise' on 'ExternalOperations': parameter 1",
                globals: globalObject
              });
              args.push(curArg);
            }
            return utils.tryWrapperForImpl(Impl.implementation.promise(...args));
          } catch (e) {
            return globalObject.Promise.reject(e);
          }
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
