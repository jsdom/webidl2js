"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;
const DefaultToJSONMiddle = require("./DefaultToJSONMiddle.js");

const interfaceName = "DefaultToJSONChild";

const $interfaceDescriptor = utils.createInterfaceDescriptor(
  () => DefaultToJSONMiddle.interfaceDescriptor,
);
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
  throw new globalObject.TypeError(`${context} is not of type 'DefaultToJSONChild'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["DefaultToJSONChild"].prototype;
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
  DefaultToJSONMiddle._internalSetup(wrapper, globalObject);
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

const exposed = new Set(["Window", "Worker"]);

exports.install = (globalObject, globalNames) => {
  if (!globalNames.some((globalName) => exposed.has(globalName))) {
    return;
  }

  const ctorRegistry = utils.initCtorRegistry(globalObject);
  class DefaultToJSONChild extends globalObject.DefaultToJSONMiddle {
    constructor() {
      return exports.setup(Object.create(new.target.prototype), globalObject, undefined);
    }

    toJSON() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "toJSON");
      return utils.newObjectInRealm(globalObject, {
        x: utils.tryWrapperForImpl($impl["x"]),
        enabled: $impl["enabled"],
        label: (() => {
          const value = $impl.getAttributeNS(null, "label");
          return value === null ? "" : value;
        })(),
        payload: $impl["payload"],
        nested: utils.tryWrapperForImpl($impl["nested"]),
        choice: utils.tryWrapperForImpl($impl["choice"]),
        names: utils.tryWrapperForImpl($impl["names"]),
        ...(globalNames.includes("Worker") ? { workerOnly: $impl["workerOnly"] } : {}),
        x: utils.tryWrapperForImpl($impl["x"]),
        child: $impl["child"],
        partialValue: $impl["partialValue"],
        mixedIn: $impl["mixedIn"],
      });
    }

    get x() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get x");
      return utils.tryWrapperForImpl($impl["x"]);
    }

    set x(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set x");

      V = conversions["unrestricted double"](V, {
        context: `Failed to set the 'x' property on 'DefaultToJSONChild': The provided value`,
        globals: globalObject,
      });

      $impl["x"] = V;
    }

    get child() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get child");
      return $impl["child"];
    }

    get partialValue() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get partialValue");
      return $impl["partialValue"];
    }

    get mixedIn() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get mixedIn");
      return $impl["mixedIn"];
    }
  }
  Object.defineProperties(DefaultToJSONChild.prototype, {
    toJSON: { enumerable: true },
    x: { enumerable: true },
    child: { enumerable: true },
    partialValue: { enumerable: true },
    mixedIn: { enumerable: true },
    [Symbol.toStringTag]: { value: "DefaultToJSONChild", configurable: true },
  });
  ctorRegistry[interfaceName] = DefaultToJSONChild;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: DefaultToJSONChild,
  });
};

const Impl = require("../implementations/DefaultToJSONChild.js");
