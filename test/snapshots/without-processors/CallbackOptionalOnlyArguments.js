"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  if (typeof value !== "function") {
    throw new globalObject.TypeError(`${context} is not a function`);
  }

  function invokeTheCallbackFunction(...args) {
    const thisArg = utils.tryWrapperForImpl(this);
    let callResult;

    for (let i = 0; i < Math.min(args.length, 1); i++) {
      args[i] = utils.tryWrapperForImpl(args[i]);
    }

    if (args.length > 1) {
      args.length = 1;
    }

    callResult = Reflect.apply(value, thisArg, args);
  }

  invokeTheCallbackFunction.construct = (...args) => {
    for (let i = 0; i < Math.min(args.length, 1); i++) {
      args[i] = utils.tryWrapperForImpl(args[i]);
    }

    if (args.length > 1) {
      args.length = 1;
    }

    let callResult = Reflect.construct(value, args);
  };

  invokeTheCallbackFunction[utils.wrapperSymbol] = value;
  invokeTheCallbackFunction.objectReference = value;

  return invokeTheCallbackFunction;
};
