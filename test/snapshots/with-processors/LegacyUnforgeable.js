"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const implSymbol = utils.implSymbol;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "LegacyUnforgeable";

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
        const esValue = this !== null && this !== undefined ? this : globalObject;
        if (!exports.is(esValue)) {
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
        return esValue[implSymbol].assign(...args);
      },
      get href() {
        const esValue = this !== null && this !== undefined ? this : globalObject;

        if (!exports.is(esValue)) {
          throw new globalObject.TypeError(
            "'get href' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        return esValue[implSymbol]["href"];
      },
      set href(V) {
        const esValue = this !== null && this !== undefined ? this : globalObject;

        if (!exports.is(esValue)) {
          throw new globalObject.TypeError(
            "'set href' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        V = conversions["USVString"](V, {
          context: "Failed to set the 'href' property on 'LegacyUnforgeable': The provided value",
          globals: globalObject
        });

        esValue[implSymbol]["href"] = V;
      },
      toString() {
        const esValue = this;
        if (!exports.is(esValue)) {
          throw new globalObject.TypeError(
            "'toString' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        return esValue[implSymbol]["href"];
      },
      get origin() {
        const esValue = this !== null && this !== undefined ? this : globalObject;

        if (!exports.is(esValue)) {
          throw new globalObject.TypeError(
            "'get origin' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        return esValue[implSymbol]["origin"];
      },
      get protocol() {
        const esValue = this !== null && this !== undefined ? this : globalObject;

        if (!exports.is(esValue)) {
          throw new globalObject.TypeError(
            "'get protocol' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        return esValue[implSymbol]["protocol"];
      },
      set protocol(V) {
        const esValue = this !== null && this !== undefined ? this : globalObject;

        if (!exports.is(esValue)) {
          throw new globalObject.TypeError(
            "'set protocol' called on an object that is not a valid instance of LegacyUnforgeable."
          );
        }

        V = conversions["USVString"](V, {
          context: "Failed to set the 'protocol' property on 'LegacyUnforgeable': The provided value",
          globals: globalObject
        });

        esValue[implSymbol]["protocol"] = V;
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
