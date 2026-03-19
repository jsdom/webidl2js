"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const URL = require("./URL.js");

exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  if (typeof value !== "function") {
    throw new globalObject.TypeError(context + " is not a function");
  }

  function invokeTheCallbackFunction(url, string) {
    const thisArg = utils.tryWrapperForImpl(this);
    let callResult;

    url = utils.tryWrapperForImpl(url);

    callResult = Reflect.apply(value, thisArg, [url, string]);

    callResult = URL.convert(globalObject, callResult, { context: context });

    return callResult;
  }

  invokeTheCallbackFunction.construct = (url, string) => {
    url = utils.tryWrapperForImpl(url);

    let callResult = Reflect.construct(value, [url, string]);

    callResult = URL.convert(globalObject, callResult, { context: context });

    return callResult;
  };

  invokeTheCallbackFunction[utils.wrapperSymbol] = value;
  invokeTheCallbackFunction.objectReference = value;

  return invokeTheCallbackFunction;
};
