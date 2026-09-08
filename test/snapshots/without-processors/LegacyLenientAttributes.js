"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "LegacyLenientAttributes";

const $interfaceDescriptor = utils.createInterfaceDescriptor();
exports.interfaceDescriptor = $interfaceDescriptor;

exports.is = value => {
  return utils.implForWrapperWithInterface(value, $interfaceDescriptor) !== null;
};
exports.isImpl = value => {
  return utils.isObject(value) && value instanceof Impl.implementation;
};
exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  const impl = utils.implForWrapperWithInterface(value, $interfaceDescriptor);
  if (impl !== null) {
    return impl;
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
  const impl = new Impl.implementation(globalObject, constructorArgs, privateData);

  utils.registerWrapper(wrapper, impl, $interfaceDescriptor);
  impl[utils.wrapperSymbol] = wrapper;
  if (Impl.init) {
    Impl.init(impl);
  }
  return wrapper;
};

exports.new = (globalObject, newTarget) => {
  const wrapper = makeWrapper(globalObject, newTarget);

  exports._internalSetup(wrapper, globalObject);
  const impl = Object.create(Impl.implementation.prototype);

  utils.registerWrapper(wrapper, impl, $interfaceDescriptor);
  impl[utils.wrapperSymbol] = wrapper;
  if (Impl.init) {
    Impl.init(impl);
  }
  return impl;
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
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get lenientSetter' called on an object that is not a valid instance of LegacyLenientAttributes."
        );
      }

      return $impl["lenientSetter"];
    }

    set lenientSetter(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set lenientSetter' called on an object that is not a valid instance of LegacyLenientAttributes."
        );
      }
    }

    get lenientThisSetter() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        return;
      }

      return $impl["lenientThisSetter"];
    }

    set lenientThisSetter(V) {}

    get lenientThis() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        return;
      }

      return $impl["lenientThis"];
    }

    set lenientThis(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        return;
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'lenientThis' property on 'LegacyLenientAttributes': The provided value",
        globals: globalObject
      });

      $impl["lenientThis"] = V;
    }

    get readonlyLenientThis() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        return;
      }

      return $impl["readonlyLenientThis"];
    }

    get replaceableLenientThis() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        return;
      }

      return $impl["replaceableLenientThis"];
    }

    set replaceableLenientThis(V) {
      const esValue = this ?? globalObject;

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
