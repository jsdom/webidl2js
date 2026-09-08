"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "Reflect";

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
  throw new globalObject.TypeError(`${context} is not of type 'Reflect'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["Reflect"].prototype;
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
  class Reflect {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    get reflectedBoolean() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get reflectedBoolean' called on an object that is not a valid instance of Reflect."
        );
      }

      return $impl["reflectedBoolean"];
    }

    set reflectedBoolean(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set reflectedBoolean' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["boolean"](V, {
        context: "Failed to set the 'reflectedBoolean' property on 'Reflect': The provided value",
        globals: globalObject
      });

      $impl["reflectedBoolean"] = V;
    }

    get reflectedDOMString() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get reflectedDOMString' called on an object that is not a valid instance of Reflect."
        );
      }

      return $impl["reflectedDOMString"];
    }

    set reflectedDOMString(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set reflectedDOMString' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'reflectedDOMString' property on 'Reflect': The provided value",
        globals: globalObject
      });

      $impl["reflectedDOMString"] = V;
    }

    get reflectedLong() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get reflectedLong' called on an object that is not a valid instance of Reflect."
        );
      }

      return $impl["reflectedLong"];
    }

    set reflectedLong(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set reflectedLong' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["long"](V, {
        context: "Failed to set the 'reflectedLong' property on 'Reflect': The provided value",
        globals: globalObject
      });

      $impl["reflectedLong"] = V;
    }

    get reflectedUnsignedLong() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get reflectedUnsignedLong' called on an object that is not a valid instance of Reflect."
        );
      }

      return $impl["reflectedUnsignedLong"];
    }

    set reflectedUnsignedLong(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set reflectedUnsignedLong' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["unsigned long"](V, {
        context: "Failed to set the 'reflectedUnsignedLong' property on 'Reflect': The provided value",
        globals: globalObject
      });

      $impl["reflectedUnsignedLong"] = V;
    }

    get reflectedUSVStringURL() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get reflectedUSVStringURL' called on an object that is not a valid instance of Reflect."
        );
      }

      return $impl["reflectedUSVStringURL"];
    }

    set reflectedUSVStringURL(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set reflectedUSVStringURL' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["USVString"](V, {
        context: "Failed to set the 'reflectedUSVStringURL' property on 'Reflect': The provided value",
        globals: globalObject
      });

      $impl["reflectedUSVStringURL"] = V;
    }

    get reflectionTest() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get reflectionTest' called on an object that is not a valid instance of Reflect."
        );
      }

      return $impl["reflectionTest"];
    }

    set reflectionTest(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set reflectionTest' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'reflectionTest' property on 'Reflect': The provided value",
        globals: globalObject
      });

      $impl["reflectionTest"] = V;
    }

    get withUnderscore() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get withUnderscore' called on an object that is not a valid instance of Reflect."
        );
      }

      return $impl["withUnderscore"];
    }

    set withUnderscore(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set withUnderscore' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'withUnderscore' property on 'Reflect': The provided value",
        globals: globalObject
      });

      $impl["withUnderscore"] = V;
    }
  }
  Object.defineProperties(Reflect.prototype, {
    reflectedBoolean: { enumerable: true },
    reflectedDOMString: { enumerable: true },
    reflectedLong: { enumerable: true },
    reflectedUnsignedLong: { enumerable: true },
    reflectedUSVStringURL: { enumerable: true },
    reflectionTest: { enumerable: true },
    withUnderscore: { enumerable: true },
    [Symbol.toStringTag]: { value: "Reflect", configurable: true }
  });
  ctorRegistry[interfaceName] = Reflect;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: Reflect
  });
};

const Impl = require("../implementations/Reflect.js");
