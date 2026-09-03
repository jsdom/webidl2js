"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const implSymbol = utils.implSymbol;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "BrandCheck";

exports.is = value => {
  return (
    utils.isObject(value) &&
    Object.hasOwn(value, implSymbol) &&
    value[implSymbol] instanceof Impl.implementation &&
    value[implSymbol][utils.wrapperSymbol] === value
  );
};
exports.isImpl = value => {
  return utils.isObject(value) && value instanceof Impl.implementation;
};
exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  if (exports.is(value)) {
    return utils.implForWrapper(value);
  }
  throw new globalObject.TypeError(`${context} is not of type 'BrandCheck'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["BrandCheck"].prototype;
  }

  return Object.create(proto);
}

exports.create = (globalObject, constructorArgs, privateData) => {
  const wrapper = makeWrapper(globalObject);
  return exports.setup(wrapper, globalObject, constructorArgs, privateData);
};

exports.createImpl = (globalObject, constructorArgs, privateData) => {
  const wrapper = exports.create(globalObject, constructorArgs, privateData);
  return utils.implForWrapper(wrapper);
};

exports._internalSetup = (wrapper, globalObject) => {};

exports.setup = (wrapper, globalObject, constructorArgs = [], privateData = {}) => {
  privateData.wrapper = wrapper;

  exports._internalSetup(wrapper, globalObject);
  Object.defineProperty(wrapper, implSymbol, {
    value: new Impl.implementation(globalObject, constructorArgs, privateData),
    configurable: true
  });

  wrapper[implSymbol][utils.wrapperSymbol] = wrapper;
  if (Impl.init) {
    Impl.init(wrapper[implSymbol]);
  }
  return wrapper;
};

exports.new = (globalObject, newTarget) => {
  const wrapper = makeWrapper(globalObject, newTarget);

  exports._internalSetup(wrapper, globalObject);
  Object.defineProperty(wrapper, implSymbol, {
    value: Object.create(Impl.implementation.prototype),
    configurable: true
  });

  wrapper[implSymbol][utils.wrapperSymbol] = wrapper;
  if (Impl.init) {
    Impl.init(wrapper[implSymbol]);
  }
  return wrapper[implSymbol];
};

const exposed = new Set(["Window"]);

exports.install = (globalObject, globalNames) => {
  if (!globalNames.some(globalName => exposed.has(globalName))) {
    return;
  }

  const ctorRegistry = utils.initCtorRegistry(globalObject);
  class BrandCheck {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    method() {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'method' called on an object that is not a valid instance of BrandCheck.");
      }

      return esValue[implSymbol].method();
    }

    get value() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'get value' called on an object that is not a valid instance of BrandCheck.");
      }

      return esValue[implSymbol]["value"];
    }

    set value(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'set value' called on an object that is not a valid instance of BrandCheck.");
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'value' property on 'BrandCheck': The provided value",
        globals: globalObject
      });

      esValue[implSymbol]["value"] = V;
    }
  }
  Object.defineProperties(BrandCheck.prototype, {
    method: { enumerable: true },
    value: { enumerable: true },
    [Symbol.toStringTag]: { value: "BrandCheck", configurable: true }
  });
  ctorRegistry[interfaceName] = BrandCheck;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: BrandCheck
  });
};

const Impl = require("../implementations/BrandCheck.js");
