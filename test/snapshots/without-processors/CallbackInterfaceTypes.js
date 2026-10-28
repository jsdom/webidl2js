"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  if (!utils.isObject(value)) {
    throw new globalObject.TypeError(`${context} is not an object.`);
  }

  function callTheUserObjectsOperation(primitive, wrapped) {
    let thisArg = utils.tryWrapperForImpl(this);
    let O = value;
    let X = O;

    if (typeof O !== "function") {
      X = O["accept"];
      if (typeof X !== "function") {
        throw new globalObject.TypeError(
          `${context} does not correctly implement CallbackInterfaceTypes.`,
        );
      }
      thisArg = O;
    }

    primitive = utils.tryWrapperForImpl(primitive);

    wrapped = utils.tryWrapperForImpl(wrapped);

    let callResult = Reflect.apply(X, thisArg, [primitive, wrapped]);

    callResult = conversions["long"](callResult, { context, globals: globalObject });

    return callResult;
  }

  callTheUserObjectsOperation[utils.wrapperSymbol] = value;
  callTheUserObjectsOperation.objectReference = value;

  return callTheUserObjectsOperation;
};

const exposed = new Set(["Window", "Worker"]);

exports.install = (globalObject, globalNames) => {
  if (!globalNames.some((globalName) => exposed.has(globalName))) {
    return;
  }

  const ctorRegistry = utils.initCtorRegistry(globalObject);
  const CallbackInterfaceTypes = () => {
    throw new globalObject.TypeError("Illegal invocation");
  };

  Object.defineProperties(CallbackInterfaceTypes, { ACCEPT: { value: 1, enumerable: true } });

  Object.defineProperty(globalObject, "CallbackInterfaceTypes", {
    configurable: true,
    writable: true,
    value: CallbackInterfaceTypes,
  });
};
