"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "Unscopable";

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
  throw new globalObject.TypeError(`${context} is not of type 'Unscopable'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["Unscopable"].prototype;
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
  class Unscopable {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    get unscopableTest() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get unscopableTest' called on an object that is not a valid instance of Unscopable."
        );
      }

      return $impl["unscopableTest"];
    }

    set unscopableTest(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set unscopableTest' called on an object that is not a valid instance of Unscopable."
        );
      }

      V = conversions["boolean"](V, {
        context: "Failed to set the 'unscopableTest' property on 'Unscopable': The provided value",
        globals: globalObject
      });

      $impl["unscopableTest"] = V;
    }

    get unscopableMixin() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get unscopableMixin' called on an object that is not a valid instance of Unscopable."
        );
      }

      return $impl["unscopableMixin"];
    }

    set unscopableMixin(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set unscopableMixin' called on an object that is not a valid instance of Unscopable."
        );
      }

      V = conversions["boolean"](V, {
        context: "Failed to set the 'unscopableMixin' property on 'Unscopable': The provided value",
        globals: globalObject
      });

      $impl["unscopableMixin"] = V;
    }
  }
  Object.defineProperties(Unscopable.prototype, {
    unscopableTest: { enumerable: true },
    unscopableMixin: { enumerable: true },
    [Symbol.toStringTag]: { value: "Unscopable", configurable: true },
    [Symbol.unscopables]: {
      value: { unscopableTest: true, unscopableMixin: true, __proto__: null },
      configurable: true
    }
  });
  ctorRegistry[interfaceName] = Unscopable;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: Unscopable
  });
};

const Impl = require("../implementations/Unscopable.js");
