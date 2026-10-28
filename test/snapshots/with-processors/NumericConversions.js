"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const newObjectInRealm = utils.newObjectInRealm;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "NumericConversions";

const $interfaceDescriptor = utils.createInterfaceDescriptor();
exports.interfaceDescriptor = $interfaceDescriptor;

function $requireImpl(wrapper, globalObject, context) {
  return utils.requireImplForWrapper(
    wrapper,
    $interfaceDescriptor,
    globalObject,
    interfaceName,
    context,
  );
}

exports.is = (value) => {
  return utils.implForWrapperWithInterface(value, $interfaceDescriptor) !== null;
};
exports.isImpl = (value) => {
  return utils.isObject(value) && value instanceof Impl.implementation;
};
exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  const impl = utils.implForWrapperWithInterface(value, $interfaceDescriptor);
  if (impl !== null) {
    return impl;
  }
  throw new globalObject.TypeError(`${context} is not of type 'NumericConversions'.`);
};

exports.createDefaultAsyncIterator = (globalObject, target, kind) => {
  const ctorRegistry = globalObject[ctorRegistrySymbol];
  const asyncIteratorPrototype = ctorRegistry["NumericConversions AsyncIterator"];
  const iterator = Object.create(asyncIteratorPrototype);
  Object.defineProperty(iterator, utils.iterInternalSymbol, {
    value: { target, kind, ongoingPromise: null, isFinished: false },
    configurable: true,
  });
  return iterator;
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["NumericConversions"].prototype;
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
  if (!globalNames.some((globalName) => exposed.has(globalName))) {
    return;
  }

  const ctorRegistry = utils.initCtorRegistry(globalObject);
  class NumericConversions {
    constructor(clamped, ranged) {
      if (arguments.length < 2) {
        throw new globalObject.TypeError(
          `Failed to construct 'NumericConversions': 2 arguments required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["octet"](curArg, {
          context: `Failed to construct 'NumericConversions': parameter 1`,
          globals: globalObject,
          clamp: true,
        });
        args.push(curArg);
      }
      {
        let curArg = arguments[1];
        curArg = conversions["unsigned short"](curArg, {
          context: `Failed to construct 'NumericConversions': parameter 2`,
          globals: globalObject,
          enforceRange: true,
        });
        args.push(curArg);
      }
      return exports.setup(Object.create(new.target.prototype), globalObject, args);
    }

    convert(clamped, ranged) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "convert");
      if (arguments.length < 2) {
        throw new globalObject.TypeError(
          `Failed to execute 'convert' on 'NumericConversions': 2 arguments required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["octet"](curArg, {
          context: `Failed to execute 'convert' on 'NumericConversions': parameter 1`,
          globals: globalObject,
          clamp: true,
        });
        args.push(curArg);
      }
      {
        let curArg = arguments[1];
        curArg = conversions["unsigned short"](curArg, {
          context: `Failed to execute 'convert' on 'NumericConversions': parameter 2`,
          globals: globalObject,
          enforceRange: true,
        });
        args.push(curArg);
      }
      return $impl.convert(...args);
    }

    convertTypedefs(clamped, ranged) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "convertTypedefs");
      if (arguments.length < 2) {
        throw new globalObject.TypeError(
          `Failed to execute 'convertTypedefs' on 'NumericConversions': 2 arguments required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["unsigned short"](curArg, {
          context: `Failed to execute 'convertTypedefs' on 'NumericConversions': parameter 1`,
          globals: globalObject,
          clamp: true,
        });
        args.push(curArg);
      }
      {
        let curArg = arguments[1];
        curArg = conversions["unsigned long"](curArg, {
          context: `Failed to execute 'convertTypedefs' on 'NumericConversions': parameter 2`,
          globals: globalObject,
          enforceRange: true,
        });
        args.push(curArg);
      }
      return $impl.convertTypedefs(...args);
    }

    convertElements(clamped, ranged) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "convertElements");
      if (arguments.length < 2) {
        throw new globalObject.TypeError(
          `Failed to execute 'convertElements' on 'NumericConversions': 2 arguments required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (!utils.isObject(curArg)) {
          throw new globalObject.TypeError(
            `Failed to execute 'convertElements' on 'NumericConversions': parameter 1 is not an iterable object.`,
          );
        } else {
          const V = [];
          const tmp = curArg;
          for (let nextItem of tmp) {
            nextItem = conversions["octet"](nextItem, {
              context: `Failed to execute 'convertElements' on 'NumericConversions': parameter 1's element`,
              globals: globalObject,
              clamp: true,
            });

            V.push(nextItem);
          }
          curArg = V;
        }
        args.push(curArg);
      }
      {
        let curArg = arguments[1];
        if (!utils.isObject(curArg)) {
          throw new globalObject.TypeError(
            `Failed to execute 'convertElements' on 'NumericConversions': parameter 2 is not an iterable object.`,
          );
        } else {
          const V = [];
          const tmp = curArg;
          for (let nextItem of tmp) {
            nextItem = conversions["unsigned short"](nextItem, {
              context: `Failed to execute 'convertElements' on 'NumericConversions': parameter 2's element`,
              globals: globalObject,
              enforceRange: true,
            });

            V.push(nextItem);
          }
          curArg = V;
        }
        args.push(curArg);
      }
      return $impl.convertElements(...args);
    }

    values() {
      const $impl = $requireImpl(this, globalObject, "values");

      const args = [];
      if (arguments[0] !== undefined) {
        args[0] = arguments[0];
        args[0] = conversions["octet"](args[0], {
          context: `Failed to execute 'values' on 'NumericConversions': parameter 1`,
          globals: globalObject,
          clamp: true,
        });
      } else {
        args[0] = 0;
      }

      if (arguments[1] !== undefined) {
        args[1] = arguments[1];
        args[1] = conversions["unsigned short"](args[1], {
          context: `Failed to execute 'values' on 'NumericConversions': parameter 2`,
          globals: globalObject,
          enforceRange: true,
        });
      } else {
        args[1] = 0;
      }

      const asyncIterator = exports.createDefaultAsyncIterator(globalObject, $impl, "value");
      if ($impl[utils.asyncIteratorInit]) {
        $impl[utils.asyncIteratorInit](asyncIterator, args);
      }
      return asyncIterator;
    }

    get clamped() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get clamped");
      return $impl["clamped"];
    }

    set clamped(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set clamped");

      V = conversions["octet"](V, {
        context: `Failed to set the 'clamped' property on 'NumericConversions': The provided value`,
        globals: globalObject,
        clamp: true,
      });

      $impl["clamped"] = V;
    }

    get ranged() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get ranged");
      return $impl["ranged"];
    }

    set ranged(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set ranged");

      V = conversions["unsigned short"](V, {
        context: `Failed to set the 'ranged' property on 'NumericConversions': The provided value`,
        globals: globalObject,
        enforceRange: true,
      });

      $impl["ranged"] = V;
    }

    get typedefClamped() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get typedefClamped");
      return utils.tryWrapperForImpl($impl["typedefClamped"]);
    }

    set typedefClamped(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set typedefClamped");

      V = conversions["unsigned short"](V, {
        context: `Failed to set the 'typedefClamped' property on 'NumericConversions': The provided value`,
        globals: globalObject,
        clamp: true,
      });

      $impl["typedefClamped"] = V;
    }

    get typedefRanged() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get typedefRanged");
      return utils.tryWrapperForImpl($impl["typedefRanged"]);
    }

    set typedefRanged(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set typedefRanged");

      V = conversions["unsigned long"](V, {
        context: `Failed to set the 'typedefRanged' property on 'NumericConversions': The provided value`,
        globals: globalObject,
        enforceRange: true,
      });

      $impl["typedefRanged"] = V;
    }
  }
  Object.defineProperties(NumericConversions.prototype, {
    convert: { enumerable: true },
    convertTypedefs: { enumerable: true },
    convertElements: { enumerable: true },
    values: { enumerable: true },
    clamped: { enumerable: true },
    ranged: { enumerable: true },
    typedefClamped: { enumerable: true },
    typedefRanged: { enumerable: true },
    [Symbol.toStringTag]: { value: "NumericConversions", configurable: true },
    [Symbol.asyncIterator]: {
      value: NumericConversions.prototype.values,
      configurable: true,
      writable: true,
    },
  });
  ctorRegistry[interfaceName] = NumericConversions;

  ctorRegistry["NumericConversions AsyncIterator"] = Object.create(
    ctorRegistry["%AsyncIteratorPrototype%"],
    {
      [Symbol.toStringTag]: {
        value: "NumericConversions AsyncIterator",
        configurable: true,
      },
    },
  );
  utils.define(ctorRegistry["NumericConversions AsyncIterator"], {
    next() {
      const internal = this && this[utils.iterInternalSymbol];
      if (!internal) {
        return globalObject.Promise.reject(
          new globalObject.TypeError(
            "next() called on a value that is not a NumericConversions async iterator object",
          ),
        );
      }

      const nextSteps = () => {
        if (internal.isFinished) {
          return globalObject.Promise.resolve(
            newObjectInRealm(globalObject, { value: undefined, done: true }),
          );
        }

        const nextPromise = internal.target[utils.asyncIteratorNext](this);
        return nextPromise.then(
          (next) => {
            internal.ongoingPromise = null;
            if (next === utils.asyncIteratorEOI) {
              internal.isFinished = true;
              return newObjectInRealm(globalObject, { value: undefined, done: true });
            }
            return newObjectInRealm(globalObject, {
              value: utils.tryWrapperForImpl(next),
              done: false,
            });
          },
          (reason) => {
            internal.ongoingPromise = null;
            internal.isFinished = true;
            throw reason;
          },
        );
      };

      internal.ongoingPromise = internal.ongoingPromise
        ? internal.ongoingPromise.then(nextSteps, nextSteps)
        : nextSteps();
      return internal.ongoingPromise;
    },
  });

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: NumericConversions,
  });
};

const Impl = require("../implementations/NumericConversions.js");
