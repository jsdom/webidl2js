"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const implSymbol = utils.implSymbol;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "MixedIn";

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
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'mixedInOp' called on an object that is not a valid instance of MixedIn.");
      }

      return esValue[implSymbol].mixedInOp();
    }

    ifaceMixinOp() {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'ifaceMixinOp' called on an object that is not a valid instance of MixedIn.");
      }

      return esValue[implSymbol].ifaceMixinOp();
    }

    get mixedInAttr() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get mixedInAttr' called on an object that is not a valid instance of MixedIn."
        );
      }

      return esValue[implSymbol]["mixedInAttr"];
    }

    set mixedInAttr(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set mixedInAttr' called on an object that is not a valid instance of MixedIn."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'mixedInAttr' property on 'MixedIn': The provided value",
        globals: globalObject
      });

      esValue[implSymbol]["mixedInAttr"] = V;
    }

    get ifaceMixinAttr() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get ifaceMixinAttr' called on an object that is not a valid instance of MixedIn."
        );
      }

      return esValue[implSymbol]["ifaceMixinAttr"];
    }

    set ifaceMixinAttr(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set ifaceMixinAttr' called on an object that is not a valid instance of MixedIn."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'ifaceMixinAttr' property on 'MixedIn': The provided value",
        globals: globalObject
      });

      esValue[implSymbol]["ifaceMixinAttr"] = V;
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
