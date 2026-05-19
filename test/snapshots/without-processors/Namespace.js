"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const namespaceName = "Namespace";
const exposed = new Set(["Window", "Worker"]);

exports.install = (globalObject, globalNames) => {
  if (!globalNames.some(globalName => exposed.has(globalName))) {
    return;
  }

  const namespaceObject = Object.create(globalObject.Object.prototype);

  utils.define(namespaceObject, {
    configure(value) {
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'configure' on 'Namespace': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["DOMString"](curArg, {
          context: "Failed to execute 'configure' on 'Namespace': parameter 1",
          globals: globalObject
        });
        args.push(curArg);
      }
      return Impl.implementation.configure(...args);
    },
    overloaded(value) {
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'overloaded' on 'Namespace': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (typeof curArg === "number") {
          {
            let curArg = arguments[0];
            curArg = conversions["unsigned long"](curArg, {
              context: "Failed to execute 'overloaded' on 'Namespace': parameter 1",
              globals: globalObject
            });
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = conversions["DOMString"](curArg, {
              context: "Failed to execute 'overloaded' on 'Namespace': parameter 1",
              globals: globalObject
            });
            args.push(curArg);
          }
        }
      }
      return Impl.implementation.overloaded(...args);
    },
    createStatic() {
      return utils.tryWrapperForImpl(Impl.implementation.createStatic(globalObject));
    },
    get version() {
      return Impl.implementation["version"];
    },
    get staticObject() {
      return utils.getSameObject(namespaceObject, "staticObject", () => {
        return utils.tryWrapperForImpl(Impl.implementation["staticObject"]);
      });
    }
  });

  Object.defineProperties(namespaceObject, {
    [Symbol.toStringTag]: { value: "Namespace", configurable: true },
    VALUE: { value: 7, enumerable: true }
  });

  Object.defineProperty(globalObject, namespaceName, {
    configurable: true,
    writable: true,
    value: namespaceObject
  });
};

const Impl = require("../implementations/Namespace.js");
