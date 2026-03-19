"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const implSymbol = utils.implSymbol;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "BufferSourceTypes";

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
  class BufferSourceTypes {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    bs(source) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].bs(...args);
    }

    ab(ab) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].ab(...args);
    }

    sab(sab) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].sab(...args);
    }

    abv(abv) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].abv(...args);
    }

    u8a(u8) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].u8a(...args);
    }

    abUnion(ab) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].abUnion(...args);
    }

    sabUnion(ab) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].sabUnion(...args);
    }

    u8aUnion(ab) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].u8aUnion(...args);
    }

    asbs(source) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].asbs(...args);
    }

    abvAllowShared(abv) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].abvAllowShared(...args);
    }

    u8aAllowShared(u8) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].u8aAllowShared(...args);
    }

    bsAllowResizable(source) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].bsAllowResizable(...args);
    }

    abAllowResizable(ab) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].abAllowResizable(...args);
    }

    sabAllowResizable(sab) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].sabAllowResizable(...args);
    }

    abvAllowResizable(abv) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].abvAllowResizable(...args);
    }

    u8aAllowResizable(u8) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].u8aAllowResizable(...args);
    }

    asbsAllowResizable(source) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].asbsAllowResizable(...args);
    }

    abvAllowResizableShared(abv) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].abvAllowResizableShared(...args);
    }

    u8aAllowResizableShared(u8) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
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
      return esValue[implSymbol].u8aAllowResizableShared(...args);
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
