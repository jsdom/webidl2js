"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "LegacyUnforgeable";

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
  throw new globalObject.TypeError(`${context} is not of type 'LegacyUnforgeable'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["LegacyUnforgeable"].prototype;
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

function getUnforgeables(globalObject) {
  let unforgeables = unforgeablesMap.get(globalObject);
  if (unforgeables === undefined) {
    unforgeables = Object.create(null);
    utils.define(unforgeables, {
      assign(url) {
        const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
        if ($impl === null) {
          throw new globalObject.TypeError(
            "'assign' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        if (arguments.length < 1) {
          throw new globalObject.TypeError(
            `Failed to execute 'assign' on 'LegacyUnforgeable': 1 argument required, but only ${arguments.length} present.`
          );
        }
        const args = [];
        {
          let curArg = arguments[0];
          curArg = conversions["USVString"](curArg, {
            context: "Failed to execute 'assign' on 'LegacyUnforgeable': parameter 1",
            globals: globalObject
          });
          args.push(curArg);
        }
        return $impl.assign(...args);
      },
      get href() {
        const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
        if ($impl === null) {
          throw new globalObject.TypeError(
            "'get href' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        return $impl["href"];
      },
      set href(V) {
        const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
        if ($impl === null) {
          throw new globalObject.TypeError(
            "'set href' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        V = conversions["USVString"](V, {
          context: "Failed to set the 'href' property on 'LegacyUnforgeable': The provided value",
          globals: globalObject
        });

        $impl["href"] = V;
      },
      toString() {
        const $impl = utils.implForWrapperWithInterface(this, $interfaceDescriptor);
        if ($impl === null) {
          throw new globalObject.TypeError(
            "'toString' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        return $impl["href"];
      },
      get origin() {
        const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
        if ($impl === null) {
          throw new globalObject.TypeError(
            "'get origin' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        return $impl["origin"];
      },
      get protocol() {
        const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
        if ($impl === null) {
          throw new globalObject.TypeError(
            "'get protocol' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        return $impl["protocol"];
      },
      set protocol(V) {
        const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
        if ($impl === null) {
          throw new globalObject.TypeError(
            "'set protocol' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        V = conversions["USVString"](V, {
          context: "Failed to set the 'protocol' property on 'LegacyUnforgeable': The provided value",
          globals: globalObject
        });

        $impl["protocol"] = V;
      }
    });
    Object.defineProperties(unforgeables, {
      assign: { configurable: false, writable: false },
      href: { configurable: false },
      toString: { configurable: false, writable: false },
      origin: { configurable: false },
      protocol: { configurable: false }
    });
    unforgeablesMap.set(globalObject, unforgeables);
  }
  return unforgeables;
}

exports._internalSetup = (wrapper, globalObject) => {
  utils.define(wrapper, getUnforgeables(globalObject));
};

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

const unforgeablesMap = new WeakMap();
const exposed = new Set(["Window"]);

exports.install = (globalObject, globalNames) => {
  if (!globalNames.some(globalName => exposed.has(globalName))) {
    return;
  }

  const ctorRegistry = utils.initCtorRegistry(globalObject);
  class LegacyUnforgeable {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }
  }
  Object.defineProperties(LegacyUnforgeable.prototype, {
    [Symbol.toStringTag]: { value: "LegacyUnforgeable", configurable: true }
  });
  ctorRegistry[interfaceName] = LegacyUnforgeable;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: LegacyUnforgeable
  });
};

const Impl = require("../implementations/LegacyUnforgeable.js");
