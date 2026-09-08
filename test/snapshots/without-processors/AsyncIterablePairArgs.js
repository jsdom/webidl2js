"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const Dictionary = require("./Dictionary.js");
const newObjectInRealm = utils.newObjectInRealm;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "AsyncIterablePairArgs";

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
  throw new globalObject.TypeError(`${context} is not of type 'AsyncIterablePairArgs'.`);
};

exports.createDefaultAsyncIterator = (globalObject, target, kind) => {
  const ctorRegistry = globalObject[ctorRegistrySymbol];
  const asyncIteratorPrototype = ctorRegistry["AsyncIterablePairArgs AsyncIterator"];
  const iterator = Object.create(asyncIteratorPrototype);
  Object.defineProperty(iterator, utils.iterInternalSymbol, {
    value: { target, kind, ongoingPromise: null, isFinished: false },
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
    proto = globalObject[ctorRegistrySymbol]["AsyncIterablePairArgs"].prototype;
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
  class AsyncIterablePairArgs {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    keys() {
      const $impl = utils.implForWrapperWithInterface(this, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'keys' called on an object that is not a valid instance of AsyncIterablePairArgs."
        );
      }

      const args = [];
      if (arguments[0] !== undefined) {
        args[0] = arguments[0];
        args[0] = conversions["boolean"](args[0], {
          context: "Failed to execute 'keys' on 'AsyncIterablePairArgs': parameter 1",
          globals: globalObject
        });
      } else {
        args[0] = false;
      }

      if (arguments[1] !== undefined) {
        args[1] = arguments[1];
        args[1] = conversions["DOMString"](args[1], {
          context: "Failed to execute 'keys' on 'AsyncIterablePairArgs': parameter 2",
          globals: globalObject
        });
      } else {
        args[1] = undefined;
      }
      args[2] = arguments[2];
      args[2] = Dictionary.convert(globalObject, args[2], {
        context: "Failed to execute 'keys' on 'AsyncIterablePairArgs': parameter 3"
      });

      const asyncIterator = exports.createDefaultAsyncIterator(globalObject, $impl, "key");
      if ($impl[utils.asyncIteratorInit]) {
        $impl[utils.asyncIteratorInit](asyncIterator, args);
      }
      return asyncIterator;
    }

    values() {
      const $impl = utils.implForWrapperWithInterface(this, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'values' called on an object that is not a valid instance of AsyncIterablePairArgs."
        );
      }

      const args = [];
      if (arguments[0] !== undefined) {
        args[0] = arguments[0];
        args[0] = conversions["boolean"](args[0], {
          context: "Failed to execute 'values' on 'AsyncIterablePairArgs': parameter 1",
          globals: globalObject
        });
      } else {
        args[0] = false;
      }

      if (arguments[1] !== undefined) {
        args[1] = arguments[1];
        args[1] = conversions["DOMString"](args[1], {
          context: "Failed to execute 'values' on 'AsyncIterablePairArgs': parameter 2",
          globals: globalObject
        });
      } else {
        args[1] = undefined;
      }
      args[2] = arguments[2];
      args[2] = Dictionary.convert(globalObject, args[2], {
        context: "Failed to execute 'values' on 'AsyncIterablePairArgs': parameter 3"
      });

      const asyncIterator = exports.createDefaultAsyncIterator(globalObject, $impl, "value");
      if ($impl[utils.asyncIteratorInit]) {
        $impl[utils.asyncIteratorInit](asyncIterator, args);
      }
      return asyncIterator;
    }

    entries() {
      const $impl = utils.implForWrapperWithInterface(this, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'entries' called on an object that is not a valid instance of AsyncIterablePairArgs."
        );
      }

      const args = [];
      if (arguments[0] !== undefined) {
        args[0] = arguments[0];
        args[0] = conversions["boolean"](args[0], {
          context: "Failed to execute 'entries' on 'AsyncIterablePairArgs': parameter 1",
          globals: globalObject
        });
      } else {
        args[0] = false;
      }

      if (arguments[1] !== undefined) {
        args[1] = arguments[1];
        args[1] = conversions["DOMString"](args[1], {
          context: "Failed to execute 'entries' on 'AsyncIterablePairArgs': parameter 2",
          globals: globalObject
        });
      } else {
        args[1] = undefined;
      }
      args[2] = arguments[2];
      args[2] = Dictionary.convert(globalObject, args[2], {
        context: "Failed to execute 'entries' on 'AsyncIterablePairArgs': parameter 3"
      });

      const asyncIterator = exports.createDefaultAsyncIterator(globalObject, $impl, "key+value");
      if ($impl[utils.asyncIteratorInit]) {
        $impl[utils.asyncIteratorInit](asyncIterator, args);
      }
      return asyncIterator;
    }
  }
  Object.defineProperties(AsyncIterablePairArgs.prototype, {
    keys: { enumerable: true },
    values: { enumerable: true },
    entries: { enumerable: true },
    [Symbol.toStringTag]: { value: "AsyncIterablePairArgs", configurable: true },
    [Symbol.asyncIterator]: { value: AsyncIterablePairArgs.prototype.entries, configurable: true, writable: true }
  });
  ctorRegistry[interfaceName] = AsyncIterablePairArgs;

  ctorRegistry["AsyncIterablePairArgs AsyncIterator"] = Object.create(ctorRegistry["%AsyncIteratorPrototype%"], {
    [Symbol.toStringTag]: {
      value: "AsyncIterablePairArgs AsyncIterator",
      configurable: true
    }
  });
  utils.define(ctorRegistry["AsyncIterablePairArgs AsyncIterator"], {
    next() {
      const internal = this && this[utils.iterInternalSymbol];
      if (!internal) {
        return globalObject.Promise.reject(
          new globalObject.TypeError(
            "next() called on a value that is not a AsyncIterablePairArgs async iterator object"
          )
        );
      }

      const nextSteps = () => {
        if (internal.isFinished) {
          return globalObject.Promise.resolve(newObjectInRealm(globalObject, { value: undefined, done: true }));
        }

        const nextPromise = internal.target[utils.asyncIteratorNext](this);
        return nextPromise.then(
          next => {
            internal.ongoingPromise = null;
            if (next === utils.asyncIteratorEOI) {
              internal.isFinished = true;
              return newObjectInRealm(globalObject, { value: undefined, done: true });
            }
            return newObjectInRealm(
              globalObject,
              utils.iteratorResult(next.map(utils.tryWrapperForImpl), internal.kind)
            );
          },
          reason => {
            internal.ongoingPromise = null;
            internal.isFinished = true;
            throw reason;
          }
        );
      };

      internal.ongoingPromise = internal.ongoingPromise
        ? internal.ongoingPromise.then(nextSteps, nextSteps)
        : nextSteps();
      return internal.ongoingPromise;
    }
  });

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: AsyncIterablePairArgs
  });
};

const Impl = require("../implementations/AsyncIterablePairArgs.js");
