"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const RequestDestination = require("./RequestDestination.js");
const URL = require("./URL.js");
const AsyncCallbackFunction = require("./AsyncCallbackFunction.js");
const AsyncCallbackInterface = require("./AsyncCallbackInterface.js");
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "TypedefsAndUnions";

const $interfaceDescriptor = utils.createInterfaceDescriptor();
exports.interfaceDescriptor = $interfaceDescriptor;

function $requireImpl(wrapper, globalObject, context) {
  return utils.requireImplForWrapper(wrapper, $interfaceDescriptor, globalObject, interfaceName, context);
}

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
  throw new globalObject.TypeError(`${context} is not of type 'TypedefsAndUnions'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["TypedefsAndUnions"].prototype;
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
  class TypedefsAndUnions {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    numOrStrConsumer(a) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "numOrStrConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'numOrStrConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (typeof curArg === "number") {
          curArg = conversions["double"](curArg, {
            context: "Failed to execute 'numOrStrConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject,
            clamp: true
          });
        } else {
          curArg = conversions["DOMString"](curArg, {
            context: "Failed to execute 'numOrStrConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        }
        args.push(curArg);
      }
      return $impl.numOrStrConsumer(...args);
    }

    numOrEnumConsumer(a) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "numOrEnumConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'numOrEnumConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (curArg === null || curArg === undefined) {
          curArg = null;
        } else {
          if (typeof curArg === "number") {
            curArg = conversions["double"](curArg, {
              context: "Failed to execute 'numOrEnumConsumer' on 'TypedefsAndUnions': parameter 1",
              globals: globalObject
            });
          } else {
            curArg = RequestDestination.convert(globalObject, curArg, {
              context: "Failed to execute 'numOrEnumConsumer' on 'TypedefsAndUnions': parameter 1"
            });
          }
        }
        args.push(curArg);
      }
      return $impl.numOrEnumConsumer(...args);
    }

    numOrStrOrNullConsumer(a) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "numOrStrOrNullConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'numOrStrOrNullConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (curArg === null || curArg === undefined) {
          curArg = null;
        } else {
          if (typeof curArg === "number") {
            curArg = conversions["double"](curArg, {
              context: "Failed to execute 'numOrStrOrNullConsumer' on 'TypedefsAndUnions': parameter 1",
              globals: globalObject,
              clamp: true,
              enforceRange: true
            });
          } else {
            curArg = conversions["DOMString"](curArg, {
              context: "Failed to execute 'numOrStrOrNullConsumer' on 'TypedefsAndUnions': parameter 1",
              globals: globalObject,
              enforceRange: true
            });
          }
        }
        args.push(curArg);
      }
      return $impl.numOrStrOrNullConsumer(...args);
    }

    numOrStrOrURLOrNullConsumer(a) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "numOrStrOrURLOrNullConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'numOrStrOrURLOrNullConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (curArg === null || curArg === undefined) {
          curArg = null;
        } else {
          if (URL.is(curArg)) {
            curArg = utils.implForWrapper(curArg);
          } else if (typeof curArg === "number") {
            curArg = conversions["double"](curArg, {
              context: "Failed to execute 'numOrStrOrURLOrNullConsumer' on 'TypedefsAndUnions': parameter 1",
              globals: globalObject,
              clamp: true,
              enforceRange: true
            });
          } else {
            curArg = conversions["DOMString"](curArg, {
              context: "Failed to execute 'numOrStrOrURLOrNullConsumer' on 'TypedefsAndUnions': parameter 1",
              globals: globalObject,
              enforceRange: true
            });
          }
        }
        args.push(curArg);
      }
      return $impl.numOrStrOrURLOrNullConsumer(...args);
    }

    numOrObjConsumer(a) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "numOrObjConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'numOrObjConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isObject(curArg)) {
          curArg = utils.tryImplForWrapper(curArg);
        } else if (typeof curArg === "number") {
          curArg = conversions["double"](curArg, {
            context: "Failed to execute 'numOrObjConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        } else {
          curArg = conversions["double"](curArg, {
            context: "Failed to execute 'numOrObjConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        }
        args.push(curArg);
      }
      return $impl.numOrObjConsumer(...args);
    }

    urlMapInnerConsumer(a) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "urlMapInnerConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'urlMapInnerConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (!utils.isObject(curArg)) {
          throw new globalObject.TypeError(
            "Failed to execute 'urlMapInnerConsumer' on 'TypedefsAndUnions': parameter 1" + " is not an object."
          );
        } else {
          const result = Object.create(null);
          for (const key of Reflect.ownKeys(curArg)) {
            const desc = Object.getOwnPropertyDescriptor(curArg, key);
            if (desc && desc.enumerable) {
              let typedKey = key;

              typedKey = conversions["USVString"](typedKey, {
                context: "Failed to execute 'urlMapInnerConsumer' on 'TypedefsAndUnions': parameter 1" + "'s key",
                globals: globalObject
              });

              let typedValue = curArg[key];

              typedValue = URL.convert(globalObject, typedValue, {
                context: "Failed to execute 'urlMapInnerConsumer' on 'TypedefsAndUnions': parameter 1" + "'s value"
              });

              result[typedKey] = typedValue;
            }
          }
          curArg = result;
        }
        args.push(curArg);
      }
      return $impl.urlMapInnerConsumer(...args);
    }

    urlMapConsumer(a) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "urlMapConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'urlMapConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (curArg === null || curArg === undefined) {
          curArg = null;
        } else {
          if (!utils.isObject(curArg)) {
            throw new globalObject.TypeError(
              "Failed to execute 'urlMapConsumer' on 'TypedefsAndUnions': parameter 1" + " is not an object."
            );
          } else {
            const result = Object.create(null);
            for (const key of Reflect.ownKeys(curArg)) {
              const desc = Object.getOwnPropertyDescriptor(curArg, key);
              if (desc && desc.enumerable) {
                let typedKey = key;

                typedKey = conversions["USVString"](typedKey, {
                  context: "Failed to execute 'urlMapConsumer' on 'TypedefsAndUnions': parameter 1" + "'s key",
                  globals: globalObject
                });

                let typedValue = curArg[key];

                typedValue = URL.convert(globalObject, typedValue, {
                  context: "Failed to execute 'urlMapConsumer' on 'TypedefsAndUnions': parameter 1" + "'s value"
                });

                result[typedKey] = typedValue;
              }
            }
            curArg = result;
          }
        }
        args.push(curArg);
      }
      return $impl.urlMapConsumer(...args);
    }

    bufferSourceOrURLConsumer(b) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "bufferSourceOrURLConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'bufferSourceOrURLConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (URL.is(curArg)) {
          curArg = utils.implForWrapper(curArg);
        } else if (utils.isArrayBuffer(curArg)) {
          curArg = conversions["ArrayBuffer"](curArg, {
            context: "Failed to execute 'bufferSourceOrURLConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        } else if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'bufferSourceOrURLConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'bufferSourceOrURLConsumer' on 'TypedefsAndUnions': parameter 1" +
              " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.bufferSourceOrURLConsumer(...args);
    }

    arrayBufferViewOrURLMapConsumer(b) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "arrayBufferViewOrURLMapConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'arrayBufferViewOrURLMapConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (curArg === null || curArg === undefined) {
          curArg = null;
        } else {
          if (ArrayBuffer.isView(curArg)) {
            curArg = conversions["ArrayBufferView"](curArg, {
              context: "Failed to execute 'arrayBufferViewOrURLMapConsumer' on 'TypedefsAndUnions': parameter 1",
              globals: globalObject
            });
          } else if (utils.isObject(curArg)) {
            if (!utils.isObject(curArg)) {
              throw new globalObject.TypeError(
                "Failed to execute 'arrayBufferViewOrURLMapConsumer' on 'TypedefsAndUnions': parameter 1" +
                  " record" +
                  " is not an object."
              );
            } else {
              const result = Object.create(null);
              for (const key of Reflect.ownKeys(curArg)) {
                const desc = Object.getOwnPropertyDescriptor(curArg, key);
                if (desc && desc.enumerable) {
                  let typedKey = key;

                  typedKey = conversions["USVString"](typedKey, {
                    context:
                      "Failed to execute 'arrayBufferViewOrURLMapConsumer' on 'TypedefsAndUnions': parameter 1" +
                      " record" +
                      "'s key",
                    globals: globalObject
                  });

                  let typedValue = curArg[key];

                  typedValue = URL.convert(globalObject, typedValue, {
                    context:
                      "Failed to execute 'arrayBufferViewOrURLMapConsumer' on 'TypedefsAndUnions': parameter 1" +
                      " record" +
                      "'s value"
                  });

                  result[typedKey] = typedValue;
                }
              }
              curArg = result;
            }
          } else {
            throw new globalObject.TypeError(
              "Failed to execute 'arrayBufferViewOrURLMapConsumer' on 'TypedefsAndUnions': parameter 1" +
                " is not of any supported type."
            );
          }
        }
        args.push(curArg);
      }
      return $impl.arrayBufferViewOrURLMapConsumer(...args);
    }

    arrayBufferViewDupConsumer(b) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "arrayBufferViewDupConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'arrayBufferViewDupConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'arrayBufferViewDupConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'arrayBufferViewDupConsumer' on 'TypedefsAndUnions': parameter 1" +
              " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.arrayBufferViewDupConsumer(...args);
    }

    arrayBufferOrSharedArrayBufferConsumer(b) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "arrayBufferOrSharedArrayBufferConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'arrayBufferOrSharedArrayBufferConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isArrayBuffer(curArg)) {
          curArg = conversions["ArrayBuffer"](curArg, {
            context: "Failed to execute 'arrayBufferOrSharedArrayBufferConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        } else if (utils.isSharedArrayBuffer(curArg)) {
          curArg = conversions["SharedArrayBuffer"](curArg, {
            context: "Failed to execute 'arrayBufferOrSharedArrayBufferConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'arrayBufferOrSharedArrayBufferConsumer' on 'TypedefsAndUnions': parameter 1" +
              " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.arrayBufferOrSharedArrayBufferConsumer(...args);
    }

    callbackFunctionOrNumConsumer(cb) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "callbackFunctionOrNumConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'callbackFunctionOrNumConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (typeof curArg === "function") {
          curArg = AsyncCallbackFunction.convert(globalObject, curArg, {
            context:
              "Failed to execute 'callbackFunctionOrNumConsumer' on 'TypedefsAndUnions': parameter 1" +
              " callback function"
          });
        } else if (typeof curArg === "number") {
          curArg = conversions["double"](curArg, {
            context: "Failed to execute 'callbackFunctionOrNumConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        } else {
          curArg = conversions["double"](curArg, {
            context: "Failed to execute 'callbackFunctionOrNumConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        }
        args.push(curArg);
      }
      return $impl.callbackFunctionOrNumConsumer(...args);
    }

    callbackInterfaceOrNumConsumer(cb) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "callbackInterfaceOrNumConsumer");
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'callbackInterfaceOrNumConsumer' on 'TypedefsAndUnions': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isObject(curArg)) {
          curArg = AsyncCallbackInterface.convert(globalObject, curArg, {
            context:
              "Failed to execute 'callbackInterfaceOrNumConsumer' on 'TypedefsAndUnions': parameter 1" +
              " callback interface"
          });
        } else if (typeof curArg === "number") {
          curArg = conversions["double"](curArg, {
            context: "Failed to execute 'callbackInterfaceOrNumConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        } else {
          curArg = conversions["double"](curArg, {
            context: "Failed to execute 'callbackInterfaceOrNumConsumer' on 'TypedefsAndUnions': parameter 1",
            globals: globalObject
          });
        }
        args.push(curArg);
      }
      return $impl.callbackInterfaceOrNumConsumer(...args);
    }

    get buf() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get buf");
      return utils.tryWrapperForImpl($impl["buf"]);
    }

    set buf(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set buf");
      if (utils.isArrayBuffer(V)) {
        V = conversions["ArrayBuffer"](V, {
          context: "Failed to set the 'buf' property on 'TypedefsAndUnions': The provided value",
          globals: globalObject
        });
      } else if (ArrayBuffer.isView(V) && V.constructor.name === "Uint8Array") {
        V = conversions["Uint8Array"](V, {
          context: "Failed to set the 'buf' property on 'TypedefsAndUnions': The provided value",
          globals: globalObject
        });
      } else if (ArrayBuffer.isView(V) && V.constructor.name === "Uint16Array") {
        V = conversions["Uint16Array"](V, {
          context: "Failed to set the 'buf' property on 'TypedefsAndUnions': The provided value",
          globals: globalObject
        });
      } else {
        throw new globalObject.TypeError(
          "Failed to set the 'buf' property on 'TypedefsAndUnions': The provided value" +
            " is not of any supported type."
        );
      }
      $impl["buf"] = V;
    }

    get time() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get time");
      return $impl["time"];
    }

    set time(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set time");

      V = conversions["unsigned long long"](V, {
        context: "Failed to set the 'time' property on 'TypedefsAndUnions': The provided value",
        globals: globalObject
      });

      $impl["time"] = V;
    }
  }
  Object.defineProperties(TypedefsAndUnions.prototype, {
    numOrStrConsumer: { enumerable: true },
    numOrEnumConsumer: { enumerable: true },
    numOrStrOrNullConsumer: { enumerable: true },
    numOrStrOrURLOrNullConsumer: { enumerable: true },
    numOrObjConsumer: { enumerable: true },
    urlMapInnerConsumer: { enumerable: true },
    urlMapConsumer: { enumerable: true },
    bufferSourceOrURLConsumer: { enumerable: true },
    arrayBufferViewOrURLMapConsumer: { enumerable: true },
    arrayBufferViewDupConsumer: { enumerable: true },
    arrayBufferOrSharedArrayBufferConsumer: { enumerable: true },
    callbackFunctionOrNumConsumer: { enumerable: true },
    callbackInterfaceOrNumConsumer: { enumerable: true },
    buf: { enumerable: true },
    time: { enumerable: true },
    [Symbol.toStringTag]: { value: "TypedefsAndUnions", configurable: true }
  });
  ctorRegistry[interfaceName] = TypedefsAndUnions;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: TypedefsAndUnions
  });
};

const Impl = require("../implementations/TypedefsAndUnions.js");
