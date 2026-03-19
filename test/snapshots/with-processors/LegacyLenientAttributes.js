"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const implSymbol = utils.implSymbol;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "LegacyLenientAttributes";

exports.is = value => {
  return utils.isObject(value) && Object.hasOwn(value, implSymbol) && value[implSymbol] instanceof Impl.implementation;
};
exports.isImpl = value => {
  return utils.isObject(value) && value instanceof Impl.implementation;
};
exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  if (exports.is(value)) {
    return utils.implForWrapper(value);
  }
  throw new globalObject.TypeError(`${context} is not of type 'LegacyLenientAttributes'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["LegacyLenientAttributes"].prototype;
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
  class LegacyLenientAttributes {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    get lenientSetter() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get lenientSetter' called on an object that is not a valid instance of LegacyLenientAttributes."
        );
      }

      return esValue[implSymbol]["lenientSetter"];
    }

    set lenientSetter(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set lenientSetter' called on an object that is not a valid instance of LegacyLenientAttributes."
        );
      }
    }

    get lenientThisSetter() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        return;
      }

      return esValue[implSymbol]["lenientThisSetter"];
    }

    set lenientThisSetter(V) {}

    get lenientThis() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        return;
      }

      return esValue[implSymbol]["lenientThis"];
    }

    set lenientThis(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        return;
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'lenientThis' property on 'LegacyLenientAttributes': The provided value",
        globals: globalObject
      });

      esValue[implSymbol]["lenientThis"] = V;
    }

    get readonlyLenientThis() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        return;
      }

      return esValue[implSymbol]["readonlyLenientThis"];
    }

    get replaceableLenientThis() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        return;
      }

      return esValue[implSymbol]["replaceableLenientThis"];
    }

    set replaceableLenientThis(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      Object.defineProperty(esValue, "replaceableLenientThis", {
        configurable: true,
        enumerable: true,
        value: V,
        writable: true
      });
    }
  }
  Object.defineProperties(LegacyLenientAttributes.prototype, {
    lenientSetter: { enumerable: true },
    lenientThisSetter: { enumerable: true },
    lenientThis: { enumerable: true },
    readonlyLenientThis: { enumerable: true },
    replaceableLenientThis: { enumerable: true },
    [Symbol.toStringTag]: { value: "LegacyLenientAttributes", configurable: true }
  });
  ctorRegistry[interfaceName] = LegacyLenientAttributes;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: LegacyLenientAttributes
  });
};

const Impl = require("../implementations/LegacyLenientAttributes.js");
