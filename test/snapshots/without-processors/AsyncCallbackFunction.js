"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  if (typeof value !== "function") {
    throw new globalObject.TypeError(context + " is not a function");
  }

  function invokeTheCallbackFunction() {
    const thisArg = utils.tryWrapperForImpl(this);
    let callResult;

    try {
      callResult = Reflect.apply(value, thisArg, []);

      callResult = new globalObject.Promise(resolve => resolve(callResult));
      return callResult;
    } catch (err) {
      return globalObject.Promise.reject(err);
    }
  }

  invokeTheCallbackFunction.construct = () => {
    let callResult = Reflect.construct(value, []);

    callResult = new globalObject.Promise(resolve => resolve(callResult));
    return callResult;
  };

  invokeTheCallbackFunction[utils.wrapperSymbol] = value;
  invokeTheCallbackFunction.objectReference = value;

  return invokeTheCallbackFunction;
};
