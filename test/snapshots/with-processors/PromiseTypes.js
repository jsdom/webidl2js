"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "PromiseTypes";

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
  throw new globalObject.TypeError(`${context} is not of type 'PromiseTypes'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["PromiseTypes"].prototype;
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
      unforgeablePromiseOperation() {
        try {
          const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
          if ($impl === null) {
            throw new globalObject.TypeError(
              "'unforgeablePromiseOperation' called on an object that is not a valid instance of PromiseTypes."
            );
          }

          return utils.tryWrapperForImpl($impl.unforgeablePromiseOperation());
        } catch (e) {
          return globalObject.Promise.reject(e);
        }
      },
      get unforgeablePromiseAttribute() {
        try {
          const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
          if ($impl === null) {
            throw new globalObject.TypeError(
              "'get unforgeablePromiseAttribute' called on an object that is not a valid instance of PromiseTypes."
            );
          }

          return utils.tryWrapperForImpl($impl["unforgeablePromiseAttribute"]);
        } catch (e) {
          return globalObject.Promise.reject(e);
        }
      }
    });
    Object.defineProperties(unforgeables, {
      unforgeablePromiseOperation: { configurable: false, writable: false },
      unforgeablePromiseAttribute: { configurable: false }
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
  class PromiseTypes {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    voidPromiseConsumer(p) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'voidPromiseConsumer' called on an object that is not a valid instance of PromiseTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'voidPromiseConsumer' on 'PromiseTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = new globalObject.Promise(resolve => resolve(curArg));
        args.push(curArg);
      }
      return $impl.voidPromiseConsumer(...args);
    }

    promiseConsumer(p) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'promiseConsumer' called on an object that is not a valid instance of PromiseTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'promiseConsumer' on 'PromiseTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = new globalObject.Promise(resolve => resolve(curArg));
        args.push(curArg);
      }
      return $impl.promiseConsumer(...args);
    }

    promiseOperation() {
      try {
        const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
        if ($impl === null) {
          throw new globalObject.TypeError(
            "'promiseOperation' called on an object that is not a valid instance of PromiseTypes."
          );
        }

        return utils.tryWrapperForImpl($impl.promiseOperation());
      } catch (e) {
        return globalObject.Promise.reject(e);
      }
    }

    get promiseAttribute() {
      try {
        const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
        if ($impl === null) {
          throw new globalObject.TypeError(
            "'get promiseAttribute' called on an object that is not a valid instance of PromiseTypes."
          );
        }

        return utils.tryWrapperForImpl($impl["promiseAttribute"]);
      } catch (e) {
        return globalObject.Promise.reject(e);
      }
    }

    static staticPromiseOperation() {
      try {
        return utils.tryWrapperForImpl(Impl.implementation.staticPromiseOperation());
      } catch (e) {
        return globalObject.Promise.reject(e);
      }
    }

    static get staticPromiseAttribute() {
      try {
        return utils.tryWrapperForImpl(Impl.implementation["staticPromiseAttribute"]);
      } catch (e) {
        return globalObject.Promise.reject(e);
      }
    }
  }
  Object.defineProperties(PromiseTypes.prototype, {
    voidPromiseConsumer: { enumerable: true },
    promiseConsumer: { enumerable: true },
    promiseOperation: { enumerable: true },
    promiseAttribute: { enumerable: true },
    [Symbol.toStringTag]: { value: "PromiseTypes", configurable: true }
  });
  Object.defineProperties(PromiseTypes, {
    staticPromiseOperation: { enumerable: true },
    staticPromiseAttribute: { enumerable: true }
  });
  ctorRegistry[interfaceName] = PromiseTypes;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: PromiseTypes
  });
};

const Impl = require("../implementations/PromiseTypes.js");
