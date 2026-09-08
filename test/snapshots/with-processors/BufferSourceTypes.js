"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "BufferSourceTypes";

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
  throw new globalObject.TypeError(`${context} is not of type 'BufferSourceTypes'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["BufferSourceTypes"].prototype;
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
  class BufferSourceTypes {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    bs(source) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError("'bs' called on an object that is not a valid instance of BufferSourceTypes.");
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'bs' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isArrayBuffer(curArg)) {
          curArg = conversions["ArrayBuffer"](curArg, {
            context: "Failed to execute 'bs' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        } else if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'bs' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'bs' on 'BufferSourceTypes': parameter 1" + " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.bs(...args);
    }

    ab(ab) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError("'ab' called on an object that is not a valid instance of BufferSourceTypes.");
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'ab' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["ArrayBuffer"](curArg, {
          context: "Failed to execute 'ab' on 'BufferSourceTypes': parameter 1",
          globals: globalObject
        });
        args.push(curArg);
      }
      return $impl.ab(...args);
    }

    sab(sab) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'sab' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'sab' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["SharedArrayBuffer"](curArg, {
          context: "Failed to execute 'sab' on 'BufferSourceTypes': parameter 1",
          globals: globalObject
        });
        args.push(curArg);
      }
      return $impl.sab(...args);
    }

    abv(abv) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'abv' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'abv' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'abv' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'abv' on 'BufferSourceTypes': parameter 1" + " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.abv(...args);
    }

    u8a(u8) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'u8a' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'u8a' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["Uint8Array"](curArg, {
          context: "Failed to execute 'u8a' on 'BufferSourceTypes': parameter 1",
          globals: globalObject
        });
        args.push(curArg);
      }
      return $impl.u8a(...args);
    }

    abUnion(ab) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'abUnion' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'abUnion' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isArrayBuffer(curArg)) {
          curArg = conversions["ArrayBuffer"](curArg, {
            context: "Failed to execute 'abUnion' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        } else {
          curArg = conversions["DOMString"](curArg, {
            context: "Failed to execute 'abUnion' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        }
        args.push(curArg);
      }
      return $impl.abUnion(...args);
    }

    sabUnion(ab) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'sabUnion' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'sabUnion' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isSharedArrayBuffer(curArg)) {
          curArg = conversions["SharedArrayBuffer"](curArg, {
            context: "Failed to execute 'sabUnion' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        } else {
          curArg = conversions["DOMString"](curArg, {
            context: "Failed to execute 'sabUnion' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        }
        args.push(curArg);
      }
      return $impl.sabUnion(...args);
    }

    u8aUnion(ab) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'u8aUnion' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'u8aUnion' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (ArrayBuffer.isView(curArg) && curArg.constructor.name === "Uint8Array") {
          curArg = conversions["Uint8Array"](curArg, {
            context: "Failed to execute 'u8aUnion' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        } else {
          curArg = conversions["DOMString"](curArg, {
            context: "Failed to execute 'u8aUnion' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        }
        args.push(curArg);
      }
      return $impl.u8aUnion(...args);
    }

    asbs(source) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'asbs' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'asbs' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isArrayBuffer(curArg)) {
          curArg = conversions["ArrayBuffer"](curArg, {
            context: "Failed to execute 'asbs' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        } else if (utils.isSharedArrayBuffer(curArg)) {
          curArg = conversions["SharedArrayBuffer"](curArg, {
            context: "Failed to execute 'asbs' on 'BufferSourceTypes': parameter 1",
            globals: globalObject
          });
        } else if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'asbs' on 'BufferSourceTypes': parameter 1",
            globals: globalObject,
            allowShared: true
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'asbs' on 'BufferSourceTypes': parameter 1" + " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.asbs(...args);
    }

    abvAllowShared(abv) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'abvAllowShared' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'abvAllowShared' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'abvAllowShared' on 'BufferSourceTypes': parameter 1",
            globals: globalObject,
            allowShared: true
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'abvAllowShared' on 'BufferSourceTypes': parameter 1" + " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.abvAllowShared(...args);
    }

    u8aAllowShared(u8) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'u8aAllowShared' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'u8aAllowShared' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["Uint8Array"](curArg, {
          context: "Failed to execute 'u8aAllowShared' on 'BufferSourceTypes': parameter 1",
          globals: globalObject,
          allowShared: true
        });
        args.push(curArg);
      }
      return $impl.u8aAllowShared(...args);
    }

    bsAllowResizable(source) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'bsAllowResizable' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'bsAllowResizable' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isArrayBuffer(curArg)) {
          curArg = conversions["ArrayBuffer"](curArg, {
            context: "Failed to execute 'bsAllowResizable' on 'BufferSourceTypes': parameter 1",
            globals: globalObject,
            allowResizable: true
          });
        } else if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'bsAllowResizable' on 'BufferSourceTypes': parameter 1",
            globals: globalObject,
            allowResizable: true
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'bsAllowResizable' on 'BufferSourceTypes': parameter 1" +
              " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.bsAllowResizable(...args);
    }

    abAllowResizable(ab) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'abAllowResizable' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'abAllowResizable' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["ArrayBuffer"](curArg, {
          context: "Failed to execute 'abAllowResizable' on 'BufferSourceTypes': parameter 1",
          globals: globalObject,
          allowResizable: true
        });
        args.push(curArg);
      }
      return $impl.abAllowResizable(...args);
    }

    sabAllowResizable(sab) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'sabAllowResizable' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'sabAllowResizable' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["SharedArrayBuffer"](curArg, {
          context: "Failed to execute 'sabAllowResizable' on 'BufferSourceTypes': parameter 1",
          globals: globalObject,
          allowResizable: true
        });
        args.push(curArg);
      }
      return $impl.sabAllowResizable(...args);
    }

    abvAllowResizable(abv) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'abvAllowResizable' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'abvAllowResizable' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'abvAllowResizable' on 'BufferSourceTypes': parameter 1",
            globals: globalObject,
            allowResizable: true
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'abvAllowResizable' on 'BufferSourceTypes': parameter 1" +
              " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.abvAllowResizable(...args);
    }

    u8aAllowResizable(u8) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'u8aAllowResizable' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'u8aAllowResizable' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["Uint8Array"](curArg, {
          context: "Failed to execute 'u8aAllowResizable' on 'BufferSourceTypes': parameter 1",
          globals: globalObject,
          allowResizable: true
        });
        args.push(curArg);
      }
      return $impl.u8aAllowResizable(...args);
    }

    asbsAllowResizable(source) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'asbsAllowResizable' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'asbsAllowResizable' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (utils.isArrayBuffer(curArg)) {
          curArg = conversions["ArrayBuffer"](curArg, {
            context: "Failed to execute 'asbsAllowResizable' on 'BufferSourceTypes': parameter 1",
            globals: globalObject,
            allowResizable: true
          });
        } else if (utils.isSharedArrayBuffer(curArg)) {
          curArg = conversions["SharedArrayBuffer"](curArg, {
            context: "Failed to execute 'asbsAllowResizable' on 'BufferSourceTypes': parameter 1",
            globals: globalObject,
            allowResizable: true
          });
        } else if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'asbsAllowResizable' on 'BufferSourceTypes': parameter 1",
            globals: globalObject,
            allowResizable: true,
            allowShared: true
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'asbsAllowResizable' on 'BufferSourceTypes': parameter 1" +
              " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.asbsAllowResizable(...args);
    }

    abvAllowResizableShared(abv) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'abvAllowResizableShared' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'abvAllowResizableShared' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (ArrayBuffer.isView(curArg)) {
          curArg = conversions["ArrayBufferView"](curArg, {
            context: "Failed to execute 'abvAllowResizableShared' on 'BufferSourceTypes': parameter 1",
            globals: globalObject,
            allowResizable: true,
            allowShared: true
          });
        } else {
          throw new globalObject.TypeError(
            "Failed to execute 'abvAllowResizableShared' on 'BufferSourceTypes': parameter 1" +
              " is not of any supported type."
          );
        }
        args.push(curArg);
      }
      return $impl.abvAllowResizableShared(...args);
    }

    u8aAllowResizableShared(u8) {
      const $impl = utils.implForWrapperWithInterface(this ?? globalObject, $interfaceDescriptor);
      if ($impl === null) {
        throw new globalObject.TypeError(
          "'u8aAllowResizableShared' called on an object that is not a valid instance of BufferSourceTypes."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'u8aAllowResizableShared' on 'BufferSourceTypes': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["Uint8Array"](curArg, {
          context: "Failed to execute 'u8aAllowResizableShared' on 'BufferSourceTypes': parameter 1",
          globals: globalObject,
          allowResizable: true,
          allowShared: true
        });
        args.push(curArg);
      }
      return $impl.u8aAllowResizableShared(...args);
    }
  }
  Object.defineProperties(BufferSourceTypes.prototype, {
    bs: { enumerable: true },
    ab: { enumerable: true },
    sab: { enumerable: true },
    abv: { enumerable: true },
    u8a: { enumerable: true },
    abUnion: { enumerable: true },
    sabUnion: { enumerable: true },
    u8aUnion: { enumerable: true },
    asbs: { enumerable: true },
    abvAllowShared: { enumerable: true },
    u8aAllowShared: { enumerable: true },
    bsAllowResizable: { enumerable: true },
    abAllowResizable: { enumerable: true },
    sabAllowResizable: { enumerable: true },
    abvAllowResizable: { enumerable: true },
    u8aAllowResizable: { enumerable: true },
    asbsAllowResizable: { enumerable: true },
    abvAllowResizableShared: { enumerable: true },
    u8aAllowResizableShared: { enumerable: true },
    [Symbol.toStringTag]: { value: "BufferSourceTypes", configurable: true }
  });
  ctorRegistry[interfaceName] = BufferSourceTypes;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: BufferSourceTypes
  });
};

const Impl = require("../implementations/BufferSourceTypes.js");
