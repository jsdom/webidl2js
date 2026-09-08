"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "UnderscoredProperties";

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
  throw new globalObject.TypeError(`${context} is not of type 'UnderscoredProperties'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["UnderscoredProperties"].prototype;
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
  class UnderscoredProperties {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    operation(sequence) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'operation' called on an object that is not a valid instance of UnderscoredProperties."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'operation' on 'UnderscoredProperties': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (!utils.isObject(curArg)) {
          throw new globalObject.TypeError(
            "Failed to execute 'operation' on 'UnderscoredProperties': parameter 1" + " is not an iterable object."
          );
        } else {
          const V = [];
          const tmp = curArg;
          for (let nextItem of tmp) {
            nextItem = conversions["DOMString"](nextItem, {
              context: "Failed to execute 'operation' on 'UnderscoredProperties': parameter 1" + "'s element",
              globals: globalObject
            });

            V.push(nextItem);
          }
          curArg = V;
        }
        args.push(curArg);
      }
      return $impl.operation(...args);
    }

    get attribute() {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'get attribute' called on an object that is not a valid instance of UnderscoredProperties."
        );
      }

      return $impl["attribute"];
    }

    set attribute(V) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'set attribute' called on an object that is not a valid instance of UnderscoredProperties."
        );
      }

      V = conversions["byte"](V, {
        context: "Failed to set the 'attribute' property on 'UnderscoredProperties': The provided value",
        globals: globalObject
      });

      $impl["attribute"] = V;
    }

    static static(void_) {
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'static' on 'UnderscoredProperties': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["DOMString"](curArg, {
          context: "Failed to execute 'static' on 'UnderscoredProperties': parameter 1",
          globals: globalObject
        });
        args.push(curArg);
      }
      return Impl.implementation.static(...args);
    }
  }
  Object.defineProperties(UnderscoredProperties.prototype, {
    operation: { enumerable: true },
    attribute: { enumerable: true },
    [Symbol.toStringTag]: { value: "UnderscoredProperties", configurable: true },
    const: { value: 42, enumerable: true }
  });
  Object.defineProperties(UnderscoredProperties, {
    static: { enumerable: true },
    const: { value: 42, enumerable: true }
  });
  ctorRegistry[interfaceName] = UnderscoredProperties;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: UnderscoredProperties
  });
};

const Impl = require("../implementations/UnderscoredProperties.js");
