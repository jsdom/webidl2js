"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const URL = require("./URL.js");
const URLSearchParams = require("./URLSearchParams.js");
const Function = require("./Function.js");
const RequestDestination = require("./RequestDestination.js");
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "OverloadTypes";

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
  throw new globalObject.TypeError(`${context} is not of type 'OverloadTypes'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["OverloadTypes"].prototype;
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
  class OverloadTypes {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    optionalValue() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "optionalValue");
      const args = [];
      switch (arguments.length) {
        case 0:
          break;
        default: {
          let curArg = arguments[0];
          if (curArg === undefined) {
            {
              let curArg = arguments[0];
              if (curArg !== undefined) {
                curArg = conversions["long"](curArg, {
                  context: `Failed to execute 'optionalValue' on 'OverloadTypes': parameter 1`,
                  globals: globalObject,
                });
              } else {
                curArg = 0;
              }
              args.push(curArg);
            }
          } else if (typeof curArg === "number") {
            {
              let curArg = arguments[0];
              if (curArg !== undefined) {
                curArg = conversions["long"](curArg, {
                  context: `Failed to execute 'optionalValue' on 'OverloadTypes': parameter 1`,
                  globals: globalObject,
                });
              } else {
                curArg = 0;
              }
              args.push(curArg);
            }
          } else {
            {
              let curArg = arguments[0];
              curArg = conversions["DOMString"](curArg, {
                context: `Failed to execute 'optionalValue' on 'OverloadTypes': parameter 1`,
                globals: globalObject,
              });
              args.push(curArg);
            }
          }
        }
      }
      return $impl.optionalValue(...args);
    }

    nullableValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "nullableValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'nullableValue' on 'OverloadTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (curArg === null || curArg === undefined) {
          {
            let curArg = arguments[0];
            if (curArg === null || curArg === undefined) {
              curArg = null;
            } else {
              curArg = URL.convert(globalObject, curArg, {
                context: `Failed to execute 'nullableValue' on 'OverloadTypes': parameter 1`,
              });
            }
            args.push(curArg);
          }
        } else if (URL.is(curArg)) {
          {
            let curArg = arguments[0];
            if (curArg === null || curArg === undefined) {
              curArg = null;
            } else {
              curArg = URL.convert(globalObject, curArg, {
                context: `Failed to execute 'nullableValue' on 'OverloadTypes': parameter 1`,
              });
            }
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = conversions["DOMString"](curArg, {
              context: `Failed to execute 'nullableValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        }
      }
      return $impl.nullableValue(...args);
    }

    selfValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "selfValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'selfValue' on 'OverloadTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (exports.is(curArg)) {
          {
            let curArg = arguments[0];
            curArg = exports.convert(globalObject, curArg, {
              context: `Failed to execute 'selfValue' on 'OverloadTypes': parameter 1`,
            });
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = conversions["DOMString"](curArg, {
              context: `Failed to execute 'selfValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        }
      }
      return $impl.selfValue(...args);
    }

    unionValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "unionValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'unionValue' on 'OverloadTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (URL.is(curArg)) {
          {
            let curArg = arguments[0];
            if (URL.is(curArg) || URLSearchParams.is(curArg)) {
              curArg = utils.implForWrapper(curArg);
            } else {
              throw new globalObject.TypeError(
                `Failed to execute 'unionValue' on 'OverloadTypes': parameter 1 is not of any supported type.`,
              );
            }
            args.push(curArg);
          }
        } else if (URLSearchParams.is(curArg)) {
          {
            let curArg = arguments[0];
            if (URL.is(curArg) || URLSearchParams.is(curArg)) {
              curArg = utils.implForWrapper(curArg);
            } else {
              throw new globalObject.TypeError(
                `Failed to execute 'unionValue' on 'OverloadTypes': parameter 1 is not of any supported type.`,
              );
            }
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = conversions["DOMString"](curArg, {
              context: `Failed to execute 'unionValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        }
      }
      return $impl.unionValue(...args);
    }

    bufferValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "bufferValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'bufferValue' on 'OverloadTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isSharedArrayBuffer(curArg)) {
          {
            let curArg = arguments[0];
            curArg = conversions["SharedArrayBuffer"](curArg, {
              context: `Failed to execute 'bufferValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        } else if (ArrayBuffer.isView(curArg) && curArg instanceof Uint8Array) {
          {
            let curArg = arguments[0];
            curArg = conversions["Uint8Array"](curArg, {
              context: `Failed to execute 'bufferValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = conversions["DOMString"](curArg, {
              context: `Failed to execute 'bufferValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        }
      }
      return $impl.bufferValue(...args);
    }

    callbackValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "callbackValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'callbackValue' on 'OverloadTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (typeof curArg === "function") {
          {
            let curArg = arguments[0];
            curArg = Function.convert(globalObject, curArg, {
              context: `Failed to execute 'callbackValue' on 'OverloadTypes': parameter 1`,
            });
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = conversions["DOMString"](curArg, {
              context: `Failed to execute 'callbackValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        }
      }
      return $impl.callbackValue(...args);
    }

    iterableValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "iterableValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'iterableValue' on 'OverloadTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isObject(curArg) && typeof curArg[Symbol.iterator] === "function") {
          {
            let curArg = arguments[0];
            if (!utils.isObject(curArg)) {
              throw new globalObject.TypeError(
                `Failed to execute 'iterableValue' on 'OverloadTypes': parameter 1 is not an iterable object.`,
              );
            } else {
              const V = [];
              const tmp = curArg;
              for (let nextItem of tmp) {
                nextItem = conversions["DOMString"](nextItem, {
                  context: `Failed to execute 'iterableValue' on 'OverloadTypes': parameter 1's element`,
                  globals: globalObject,
                });

                V.push(nextItem);
              }
              curArg = V;
            }
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = conversions["DOMString"](curArg, {
              context: `Failed to execute 'iterableValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        }
      }
      return $impl.iterableValue(...args);
    }

    objectValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "objectValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'objectValue' on 'OverloadTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isObject(curArg)) {
          {
            let curArg = arguments[0];
            curArg = conversions["object"](curArg, {
              context: `Failed to execute 'objectValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        } else if (typeof curArg === "boolean") {
          {
            let curArg = arguments[0];
            curArg = conversions["boolean"](curArg, {
              context: `Failed to execute 'objectValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = conversions["boolean"](curArg, {
              context: `Failed to execute 'objectValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        }
      }
      return $impl.objectValue(...args);
    }

    numericFallbackValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "numericFallbackValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'numericFallbackValue' on 'OverloadTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (URL.is(curArg)) {
          {
            let curArg = arguments[0];
            curArg = URL.convert(globalObject, curArg, {
              context: `Failed to execute 'numericFallbackValue' on 'OverloadTypes': parameter 1`,
            });
            args.push(curArg);
          }
        } else if (typeof curArg === "number") {
          {
            let curArg = arguments[0];
            curArg = conversions["long"](curArg, {
              context: `Failed to execute 'numericFallbackValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = conversions["long"](curArg, {
              context: `Failed to execute 'numericFallbackValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        }
      }
      return $impl.numericFallbackValue(...args);
    }

    enumerationValue(value) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "enumerationValue");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'enumerationValue' on 'OverloadTypes': 1 argument required, but only ${arguments.length} present.`,
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (typeof curArg === "number") {
          {
            let curArg = arguments[0];
            curArg = conversions["long"](curArg, {
              context: `Failed to execute 'enumerationValue' on 'OverloadTypes': parameter 1`,
              globals: globalObject,
            });
            args.push(curArg);
          }
        } else {
          {
            let curArg = arguments[0];
            curArg = RequestDestination.convert(globalObject, curArg, {
              context: `Failed to execute 'enumerationValue' on 'OverloadTypes': parameter 1`,
            });
            args.push(curArg);
          }
        }
      }
      return $impl.enumerationValue(...args);
    }
  }
  Object.defineProperties(OverloadTypes.prototype, {
    optionalValue: { enumerable: true },
    nullableValue: { enumerable: true },
    selfValue: { enumerable: true },
    unionValue: { enumerable: true },
    bufferValue: { enumerable: true },
    callbackValue: { enumerable: true },
    iterableValue: { enumerable: true },
    objectValue: { enumerable: true },
    numericFallbackValue: { enumerable: true },
    enumerationValue: { enumerable: true },
    [Symbol.toStringTag]: { value: "OverloadTypes", configurable: true },
  });
  ctorRegistry[interfaceName] = OverloadTypes;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: OverloadTypes,
  });
};

const Impl = require("../implementations/OverloadTypes.js");
