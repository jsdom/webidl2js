"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const Dictionary = require("./Dictionary.js");
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "UnionTypes";

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
  throw new globalObject.TypeError(`${context} is not of type 'UnionTypes'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["UnionTypes"].prototype;
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
  class UnionTypes {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    dictionaryValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "dictionaryValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'dictionaryValue' on 'UnionTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (curArg === null || curArg === undefined) {
          curArg = Dictionary.convert(globalObject, curArg, {
            context: `Failed to execute 'dictionaryValue' on 'UnionTypes': parameter 1`,
          });
        } else if (utils.isObject(curArg)) {
          curArg = Dictionary.convert(globalObject, curArg, {
            context: `Failed to execute 'dictionaryValue' on 'UnionTypes': parameter 1 dictionary`,
          });
        } else {
          curArg = conversions["DOMString"](curArg, {
            context: `Failed to execute 'dictionaryValue' on 'UnionTypes': parameter 1`,
            globals: globalObject,
          });
        }
        args.push(curArg);
      }
      return $impl.dictionaryValue(...args);
    }

    iterableOrDictionaryValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "iterableOrDictionaryValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'iterableOrDictionaryValue' on 'UnionTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (curArg === null || curArg === undefined) {
          curArg = Dictionary.convert(globalObject, curArg, {
            context: `Failed to execute 'iterableOrDictionaryValue' on 'UnionTypes': parameter 1`,
          });
        } else if (utils.isObject(curArg)) {
          if (
            utils.getMethod(
              curArg,
              Symbol.iterator,
              `Failed to execute 'iterableOrDictionaryValue' on 'UnionTypes': parameter 1`,
            ) !== undefined
          ) {
            if (!utils.isObject(curArg)) {
              throw new globalObject.TypeError(
                `Failed to execute 'iterableOrDictionaryValue' on 'UnionTypes': parameter 1 sequence is not an iterable object.`,
              );
            } else {
              const V = [];
              const tmp = curArg;
              for (let nextItem of tmp) {
                nextItem = conversions["DOMString"](nextItem, {
                  context: `Failed to execute 'iterableOrDictionaryValue' on 'UnionTypes': parameter 1 sequence's element`,
                  globals: globalObject,
                });

                V.push(nextItem);
              }
              curArg = V;
            }
          } else {
            curArg = Dictionary.convert(globalObject, curArg, {
              context: `Failed to execute 'iterableOrDictionaryValue' on 'UnionTypes': parameter 1 dictionary`,
            });
          }
        } else {
          throw new globalObject.TypeError(
            `Failed to execute 'iterableOrDictionaryValue' on 'UnionTypes': parameter 1 is not of any supported type.`,
          );
        }
        args.push(curArg);
      }
      return $impl.iterableOrDictionaryValue(...args);
    }

    asyncIterableValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "asyncIterableValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'asyncIterableValue' on 'UnionTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isObject(curArg)) {
          if (
            utils.getMethod(
              curArg,
              Symbol.asyncIterator,
              `Failed to execute 'asyncIterableValue' on 'UnionTypes': parameter 1`,
            ) !== undefined ||
            utils.getMethod(
              curArg,
              Symbol.iterator,
              `Failed to execute 'asyncIterableValue' on 'UnionTypes': parameter 1`,
            ) !== undefined
          ) {
            curArg = utils.convertAsyncSequence(
              curArg,
              function (item) {
                item = conversions["DOMString"](item, {
                  context: `Failed to execute 'asyncIterableValue' on 'UnionTypes': parameter 1 async_sequence's element`,
                  globals: globalObject,
                });
                return item;
              },
              `Failed to execute 'asyncIterableValue' on 'UnionTypes': parameter 1 async_sequence`,
            );
          } else {
          }
        } else if (typeof curArg === "boolean") {
          curArg = conversions["boolean"](curArg, {
            context: `Failed to execute 'asyncIterableValue' on 'UnionTypes': parameter 1`,
            globals: globalObject,
          });
        } else {
          curArg = conversions["boolean"](curArg, {
            context: `Failed to execute 'asyncIterableValue' on 'UnionTypes': parameter 1`,
            globals: globalObject,
          });
        }
        args.push(curArg);
      }
      return $impl.asyncIterableValue(...args);
    }

    frozenArrayValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "frozenArrayValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'frozenArrayValue' on 'UnionTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isObject(curArg)) {
          if (
            utils.getMethod(
              curArg,
              Symbol.iterator,
              `Failed to execute 'frozenArrayValue' on 'UnionTypes': parameter 1`,
            ) !== undefined
          ) {
            if (!utils.isObject(curArg)) {
              throw new globalObject.TypeError(
                `Failed to execute 'frozenArrayValue' on 'UnionTypes': parameter 1 FrozenArray is not an iterable object.`,
              );
            } else {
              const V = [];
              const tmp = curArg;
              for (let nextItem of tmp) {
                nextItem = conversions["DOMString"](nextItem, {
                  context: `Failed to execute 'frozenArrayValue' on 'UnionTypes': parameter 1 FrozenArray's element`,
                  globals: globalObject,
                });

                V.push(nextItem);
              }
              curArg = V;
            }
            curArg = Object.freeze(curArg);
          } else {
          }
        } else if (typeof curArg === "boolean") {
          curArg = conversions["boolean"](curArg, {
            context: `Failed to execute 'frozenArrayValue' on 'UnionTypes': parameter 1`,
            globals: globalObject,
          });
        } else {
          curArg = conversions["boolean"](curArg, {
            context: `Failed to execute 'frozenArrayValue' on 'UnionTypes': parameter 1`,
            globals: globalObject,
          });
        }
        args.push(curArg);
      }
      return $impl.frozenArrayValue(...args);
    }

    booleanOrNumberValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "booleanOrNumberValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'booleanOrNumberValue' on 'UnionTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (typeof curArg === "boolean") {
          curArg = conversions["boolean"](curArg, {
            context: `Failed to execute 'booleanOrNumberValue' on 'UnionTypes': parameter 1`,
            globals: globalObject,
          });
        } else if (typeof curArg === "number") {
          curArg = conversions["long"](curArg, {
            context: `Failed to execute 'booleanOrNumberValue' on 'UnionTypes': parameter 1`,
            globals: globalObject,
          });
        } else {
          curArg = conversions["long"](curArg, {
            context: `Failed to execute 'booleanOrNumberValue' on 'UnionTypes': parameter 1`,
            globals: globalObject,
          });
        }
        args.push(curArg);
      }
      return $impl.booleanOrNumberValue(...args);
    }

    selfValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "selfValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'selfValue' on 'UnionTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (exports.is(curArg)) {
          curArg = utils.implForWrapper(curArg);
        } else {
          curArg = conversions["DOMString"](curArg, {
            context: `Failed to execute 'selfValue' on 'UnionTypes': parameter 1`,
            globals: globalObject,
          });
        }
        args.push(curArg);
      }
      return $impl.selfValue(...args);
    }

    unknownValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "unknownValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'unknownValue' on 'UnionTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = utils.tryImplForWrapper(curArg);
        args.push(curArg);
      }
      return $impl.unknownValue(...args);
    }
  }
  Object.defineProperties(UnionTypes.prototype, {
    dictionaryValue: { enumerable: true },
    iterableOrDictionaryValue: { enumerable: true },
    asyncIterableValue: { enumerable: true },
    frozenArrayValue: { enumerable: true },
    booleanOrNumberValue: { enumerable: true },
    selfValue: { enumerable: true },
    unknownValue: { enumerable: true },
    [Symbol.toStringTag]: { value: "UnionTypes", configurable: true },
  });
  ctorRegistry[interfaceName] = UnionTypes;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: UnionTypes,
  });
};

const Impl = require("../implementations/UnionTypes.js");
