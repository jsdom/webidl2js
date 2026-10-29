"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "DefaultToJSONTypes";

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
  throw new globalObject.TypeError(`${context} is not of type 'DefaultToJSONTypes'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["DefaultToJSONTypes"].prototype;
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
  class DefaultToJSONTypes {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    toJSON() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "toJSON");
      return utils.newObjectInRealm(globalObject, {
        text: utils.tryWrapperForImpl($impl["text"]),
        enumValue: utils.tryWrapperForImpl($impl["enumValue"]),
        inherited: utils.tryWrapperForImpl($impl["inherited"]),
        interfaceUnion: utils.tryWrapperForImpl($impl["interfaceUnion"]),
        sequenceValue: utils.tryWrapperForImpl($impl["sequenceValue"]),
        frozenEnums: utils.tryWrapperForImpl($impl["frozenEnums"]),
        recordValue: utils.tryWrapperForImpl($impl["recordValue"]),
        dictionaryValue: utils.tryWrapperForImpl($impl["dictionaryValue"]),
        recursiveDictionary: utils.tryWrapperForImpl($impl["recursiveDictionary"]),
      });
    }

    get text() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get text");
      return utils.tryWrapperForImpl($impl["text"]);
    }

    get enumValue() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get enumValue");
      return utils.tryWrapperForImpl($impl["enumValue"]);
    }

    get inherited() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get inherited");
      return utils.tryWrapperForImpl($impl["inherited"]);
    }

    get interfaceUnion() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get interfaceUnion");
      return utils.tryWrapperForImpl($impl["interfaceUnion"]);
    }

    get sequenceValue() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get sequenceValue");
      return utils.tryWrapperForImpl($impl["sequenceValue"]);
    }

    get frozenEnums() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get frozenEnums");
      return utils.tryWrapperForImpl($impl["frozenEnums"]);
    }

    get recordValue() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get recordValue");
      return utils.tryWrapperForImpl($impl["recordValue"]);
    }

    get dictionaryValue() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get dictionaryValue");
      return utils.tryWrapperForImpl($impl["dictionaryValue"]);
    }

    get recursiveDictionary() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get recursiveDictionary");
      return utils.tryWrapperForImpl($impl["recursiveDictionary"]);
    }

    get nonJSONInterface() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get nonJSONInterface");
      return utils.tryWrapperForImpl($impl["nonJSONInterface"]);
    }

    get nonJSONStatic() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get nonJSONStatic");
      return utils.tryWrapperForImpl($impl["nonJSONStatic"]);
    }

    get nonJSONDictionary() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get nonJSONDictionary");
      return utils.tryWrapperForImpl($impl["nonJSONDictionary"]);
    }

    get nonJSONRecursiveDictionary() {
      const $impl = $requireImpl(
        this ?? globalObject,
        globalObject,
        "get nonJSONRecursiveDictionary",
      );
      return utils.tryWrapperForImpl($impl["nonJSONRecursiveDictionary"]);
    }

    get nonJSONSequence() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get nonJSONSequence");
      return utils.tryWrapperForImpl($impl["nonJSONSequence"]);
    }

    get nonJSONFrozenArray() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get nonJSONFrozenArray");
      return utils.tryWrapperForImpl($impl["nonJSONFrozenArray"]);
    }

    get nonJSONRecord() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get nonJSONRecord");
      return utils.tryWrapperForImpl($impl["nonJSONRecord"]);
    }

    get nonJSONCallbackInterface() {
      const $impl = $requireImpl(
        this ?? globalObject,
        globalObject,
        "get nonJSONCallbackInterface",
      );
      return utils.tryWrapperForImpl($impl["nonJSONCallbackInterface"]);
    }

    get buffer() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get buffer");
      return $impl["buffer"];
    }
  }
  Object.defineProperties(DefaultToJSONTypes.prototype, {
    toJSON: { enumerable: true },
    text: { enumerable: true },
    enumValue: { enumerable: true },
    inherited: { enumerable: true },
    interfaceUnion: { enumerable: true },
    sequenceValue: { enumerable: true },
    frozenEnums: { enumerable: true },
    recordValue: { enumerable: true },
    dictionaryValue: { enumerable: true },
    recursiveDictionary: { enumerable: true },
    nonJSONInterface: { enumerable: true },
    nonJSONStatic: { enumerable: true },
    nonJSONDictionary: { enumerable: true },
    nonJSONRecursiveDictionary: { enumerable: true },
    nonJSONSequence: { enumerable: true },
    nonJSONFrozenArray: { enumerable: true },
    nonJSONRecord: { enumerable: true },
    nonJSONCallbackInterface: { enumerable: true },
    buffer: { enumerable: true },
    [Symbol.toStringTag]: { value: "DefaultToJSONTypes", configurable: true },
  });
  ctorRegistry[interfaceName] = DefaultToJSONTypes;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: DefaultToJSONTypes,
  });
};

const Impl = require("../implementations/DefaultToJSONTypes.js");
