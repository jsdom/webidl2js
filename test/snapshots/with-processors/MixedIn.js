"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "MixedIn";

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
  throw new globalObject.TypeError(`${context} is not of type 'MixedIn'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["MixedIn"].prototype;
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
  class MixedIn {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    mixedInOp() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError("'mixedInOp' called on an object that is not a valid instance of MixedIn.");
      }

      return $impl.mixedInOp();
    }

    ifaceMixinOp() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError("'ifaceMixinOp' called on an object that is not a valid instance of MixedIn.");
      }

      return $impl.ifaceMixinOp();
    }

    get mixedInAttr() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get mixedInAttr' called on an object that is not a valid instance of MixedIn."
        );
      }

      return $impl["mixedInAttr"];
    }

    set mixedInAttr(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set mixedInAttr' called on an object that is not a valid instance of MixedIn."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'mixedInAttr' property on 'MixedIn': The provided value",
        globals: globalObject
      });

      $impl["mixedInAttr"] = V;
    }

    get ifaceMixinAttr() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get ifaceMixinAttr' called on an object that is not a valid instance of MixedIn."
        );
      }

      return $impl["ifaceMixinAttr"];
    }

    set ifaceMixinAttr(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set ifaceMixinAttr' called on an object that is not a valid instance of MixedIn."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'ifaceMixinAttr' property on 'MixedIn': The provided value",
        globals: globalObject
      });

      $impl["ifaceMixinAttr"] = V;
    }
  }
  Object.defineProperties(MixedIn.prototype, {
    mixedInOp: { enumerable: true },
    ifaceMixinOp: { enumerable: true },
    mixedInAttr: { enumerable: true },
    ifaceMixinAttr: { enumerable: true },
    [Symbol.toStringTag]: { value: "MixedIn", configurable: true },
    mixedInConst: { value: 43, enumerable: true },
    ifaceMixinConst: { value: 42, enumerable: true }
  });
  Object.defineProperties(MixedIn, {
    mixedInConst: { value: 43, enumerable: true },
    ifaceMixinConst: { value: 42, enumerable: true }
  });
  ctorRegistry[interfaceName] = MixedIn;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: MixedIn
  });
};

const Impl = require("../implementations/MixedIn.js");
