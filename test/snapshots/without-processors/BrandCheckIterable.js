"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const Function = require("./Function.js");
const newObjectInRealm = utils.newObjectInRealm;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "BrandCheckIterable";

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
  throw new globalObject.TypeError(`${context} is not of type 'BrandCheckIterable'.`);
};

exports.createDefaultIterator = (globalObject, target, kind) => {
  const ctorRegistry = globalObject[ctorRegistrySymbol];
  const iteratorPrototype = ctorRegistry["BrandCheckIterable Iterator"];
  const iterator = Object.create(iteratorPrototype);
  Object.defineProperty(iterator, utils.iterInternalSymbol, {
    value: { target, kind, index: 0 },
    configurable: true
  });
  return iterator;
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["BrandCheckIterable"].prototype;
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
  class BrandCheckIterable {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    keys() {
      const $impl = utils.implForWrapperWithInterface(this, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'keys' called on an object that is not a valid instance of BrandCheckIterable."
        );
      }

      return exports.createDefaultIterator(globalObject, $impl, "key");
    }

    values() {
      const $impl = utils.implForWrapperWithInterface(this, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'values' called on an object that is not a valid instance of BrandCheckIterable."
        );
      }

      return exports.createDefaultIterator(globalObject, $impl, "value");
    }

    entries() {
      const $impl = utils.implForWrapperWithInterface(this, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'entries' called on an object that is not a valid instance of BrandCheckIterable."
        );
      }

      return exports.createDefaultIterator(globalObject, $impl, "key+value");
    }

    forEach(callback) {
      const $impl = utils.implForWrapperWithInterface(this, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'forEach' called on an object that is not a valid instance of BrandCheckIterable."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          "Failed to execute 'forEach' on 'iterable': 1 argument required, but only 0 present."
        );
      }
      callback = Function.convert(globalObject, callback, {
        context: "Failed to execute 'forEach' on 'iterable': The callback provided as parameter 1"
      });
      const thisArg = arguments[1];
      let pairs = Array.from($impl);
      let i = 0;
      while (i < pairs.length) {
        const [key, value] = pairs[i].map(utils.tryWrapperForImpl);
        callback.call(thisArg, value, key, this);
        pairs = Array.from($impl);
        i++;
      }
    }
  }
  Object.defineProperties(BrandCheckIterable.prototype, {
    keys: { enumerable: true },
    values: { enumerable: true },
    entries: { enumerable: true },
    forEach: { enumerable: true },
    [Symbol.toStringTag]: { value: "BrandCheckIterable", configurable: true },
    [Symbol.iterator]: { value: BrandCheckIterable.prototype.entries, configurable: true, writable: true }
  });
  ctorRegistry[interfaceName] = BrandCheckIterable;

  ctorRegistry["BrandCheckIterable Iterator"] = Object.create(ctorRegistry["%IteratorPrototype%"], {
    [Symbol.toStringTag]: {
      configurable: true,
      value: "BrandCheckIterable Iterator"
    }
  });
  utils.define(ctorRegistry["BrandCheckIterable Iterator"], {
    next() {
      const internal = this && this[utils.iterInternalSymbol];
      if (!internal) {
        throw new globalObject.TypeError("next() called on a value that is not a BrandCheckIterable iterator object");
      }

      const { target, kind, index } = internal;
      const values = Array.from(target);
      const len = values.length;
      if (index >= len) {
        return newObjectInRealm(globalObject, { value: undefined, done: true });
      }

      const pair = values[index];
      internal.index = index + 1;
      return newObjectInRealm(globalObject, utils.iteratorResult(pair.map(utils.tryWrapperForImpl), kind));
    }
  });

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: BrandCheckIterable
  });
};

const Impl = require("../implementations/BrandCheckIterable.js");
