"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;
const BrandCheckParent = require("./BrandCheckParent.js");

const interfaceName = "BrandCheck";

const $interfaceDescriptor = utils.createInterfaceDescriptor(() => BrandCheckParent.interfaceDescriptor);
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
  throw new globalObject.TypeError(`${context} is not of type 'BrandCheck'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["BrandCheck"].prototype;
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

exports._internalSetup = (wrapper, globalObject) => {
  BrandCheckParent._internalSetup(wrapper, globalObject);
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

const exposed = new Set(["Window"]);

exports.install = (globalObject, globalNames) => {
  if (!globalNames.some(globalName => exposed.has(globalName))) {
    return;
  }

  const ctorRegistry = utils.initCtorRegistry(globalObject);
  class BrandCheck extends globalObject.BrandCheckParent {
    constructor() {
      return exports.setup(Object.create(new.target.prototype), globalObject, undefined);
    }

    childMethod() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'childMethod' called on an object that is not a valid instance of BrandCheck."
        );
      }

      return $impl.childMethod();
    }

    shadow(interfaceDescriptor) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError("'shadow' called on an object that is not a valid instance of BrandCheck.");
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'shadow' on 'BrandCheck': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["any"](curArg, {
          context: "Failed to execute 'shadow' on 'BrandCheck': parameter 1",
          globals: globalObject
        });
        args.push(curArg);
      }
      return $impl.shadow(...args);
    }

    objectUnion(value) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'objectUnion' called on an object that is not a valid instance of BrandCheck."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'objectUnion' on 'BrandCheck': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isObject(curArg)) {
          curArg = utils.tryImplForWrapper(curArg);
        } else if (typeof curArg === "number") {
          curArg = conversions["double"](curArg, {
            context: "Failed to execute 'objectUnion' on 'BrandCheck': parameter 1",
            globals: globalObject
          });
        } else {
          curArg = conversions["double"](curArg, {
            context: "Failed to execute 'objectUnion' on 'BrandCheck': parameter 1",
            globals: globalObject
          });
        }
        args.push(curArg);
      }
      return $impl.objectUnion(...args);
    }
  }
  Object.defineProperties(BrandCheck.prototype, {
    childMethod: { enumerable: true },
    shadow: { enumerable: true },
    objectUnion: { enumerable: true },
    [Symbol.toStringTag]: { value: "BrandCheck", configurable: true }
  });
  ctorRegistry[interfaceName] = BrandCheck;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: BrandCheck
  });
};

const Impl = require("../implementations/BrandCheck.js");
