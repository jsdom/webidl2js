"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  if (typeof value !== "function") {
    throw new globalObject.TypeError(`${context} is not a function`);
  }

  function invokeTheCallbackFunction(primitive, wrapped) {
    const thisArg = utils.tryWrapperForImpl(this);
    let callResult;

    wrapped = utils.tryWrapperForImpl(wrapped);

    callResult = Reflect.apply(value, thisArg, [primitive, wrapped]);

    callResult = conversions["long"](callResult, { context, globals: globalObject });

    return callResult;
  }

  invokeTheCallbackFunction.construct = (primitive, wrapped) => {
    wrapped = utils.tryWrapperForImpl(wrapped);

    let callResult = Reflect.construct(value, [primitive, wrapped]);

    callResult = conversions["long"](callResult, { context, globals: globalObject });

    return callResult;
  };

  invokeTheCallbackFunction[utils.wrapperSymbol] = value;
  invokeTheCallbackFunction.objectReference = value;

  return invokeTheCallbackFunction;
};
