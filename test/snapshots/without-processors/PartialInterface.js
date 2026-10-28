"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "PartialInterface";

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
  throw new globalObject.TypeError(`${context} is not of type 'PartialInterface'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["PartialInterface"].prototype;
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
  class PartialInterface {
    constructor() {
      return exports.setup(Object.create(new.target.prototype), globalObject, undefined);
    }

    operation(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "operation");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'operation' on 'PartialInterface': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["long"](curArg, {
          context: `Failed to execute 'operation' on 'PartialInterface': parameter 1`,
          globals: globalObject,
        });
        args.push(curArg);
      }
      return $impl.operation(...args);
    }

    partialOperation(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "partialOperation");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'partialOperation' on 'PartialInterface': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["DOMString"](curArg, {
          context: `Failed to execute 'partialOperation' on 'PartialInterface': parameter 1`,
          globals: globalObject,
        });
        args.push(curArg);
      }
      return $impl.partialOperation(...args);
    }

    get value() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get value");
      return $impl["value"];
    }

    set value(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set value");

      V = conversions["DOMString"](V, {
        context: `Failed to set the 'value' property on 'PartialInterface': The provided value`,
        globals: globalObject,
      });

      $impl["value"] = V;
    }
  }
  Object.defineProperties(PartialInterface.prototype, {
    operation: { enumerable: true },
    partialOperation: { enumerable: true },
    value: { enumerable: true },
    [Symbol.toStringTag]: { value: "PartialInterface", configurable: true },
    ENABLED: { value: true, enumerable: true },
    NOT_A_NUMBER: { value: NaN, enumerable: true },
    POSITIVE_INFINITY: { value: Infinity, enumerable: true },
    NEGATIVE_INFINITY: { value: -Infinity, enumerable: true },
  });
  Object.defineProperties(PartialInterface, {
    ENABLED: { value: true, enumerable: true },
    NOT_A_NUMBER: { value: NaN, enumerable: true },
    POSITIVE_INFINITY: { value: Infinity, enumerable: true },
    NEGATIVE_INFINITY: { value: -Infinity, enumerable: true },
  });
  ctorRegistry[interfaceName] = PartialInterface;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: PartialInterface,
  });
};

const Impl = require("../implementations/PartialInterface.js");
