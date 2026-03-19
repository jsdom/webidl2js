"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const URL = require("./URL.js");
const implSymbol = utils.implSymbol;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "SeqAndRec";

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
  throw new globalObject.TypeError(`${context} is not of type 'SeqAndRec'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["SeqAndRec"].prototype;
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
  class SeqAndRec {
    constructor() {
      return exports.setup(Object.create(new.target.prototype), globalObject, undefined);
    }

    recordConsumer(rec) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'recordConsumer' called on an object that is not a valid instance of SeqAndRec."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'recordConsumer' on 'SeqAndRec': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (!utils.isObject(curArg)) {
          throw new globalObject.TypeError(
            "Failed to execute 'recordConsumer' on 'SeqAndRec': parameter 1" + " is not an object."
          );
        } else {
          const result = Object.create(null);
          for (const key of Reflect.ownKeys(curArg)) {
            const desc = Object.getOwnPropertyDescriptor(curArg, key);
            if (desc && desc.enumerable) {
              let typedKey = key;

              typedKey = conversions["USVString"](typedKey, {
                context: "Failed to execute 'recordConsumer' on 'SeqAndRec': parameter 1" + "'s key",
                globals: globalObject
              });

              let typedValue = curArg[key];

              typedValue = conversions["double"](typedValue, {
                context: "Failed to execute 'recordConsumer' on 'SeqAndRec': parameter 1" + "'s value",
                globals: globalObject
              });

              result[typedKey] = typedValue;
            }
          }
          curArg = result;
        }
        args.push(curArg);
      }
      return esValue[implSymbol].recordConsumer(...args);
    }

    recordConsumer2(rec) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'recordConsumer2' called on an object that is not a valid instance of SeqAndRec."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'recordConsumer2' on 'SeqAndRec': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (!utils.isObject(curArg)) {
          throw new globalObject.TypeError(
            "Failed to execute 'recordConsumer2' on 'SeqAndRec': parameter 1" + " is not an object."
          );
        } else {
          const result = Object.create(null);
          for (const key of Reflect.ownKeys(curArg)) {
            const desc = Object.getOwnPropertyDescriptor(curArg, key);
            if (desc && desc.enumerable) {
              let typedKey = key;

              typedKey = conversions["USVString"](typedKey, {
                context: "Failed to execute 'recordConsumer2' on 'SeqAndRec': parameter 1" + "'s key",
                globals: globalObject
              });

              let typedValue = curArg[key];

              typedValue = URL.convert(globalObject, typedValue, {
                context: "Failed to execute 'recordConsumer2' on 'SeqAndRec': parameter 1" + "'s value"
              });

              result[typedKey] = typedValue;
            }
          }
          curArg = result;
        }
        args.push(curArg);
      }
      return esValue[implSymbol].recordConsumer2(...args);
    }

    sequenceConsumer(seq) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'sequenceConsumer' called on an object that is not a valid instance of SeqAndRec."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'sequenceConsumer' on 'SeqAndRec': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (!utils.isObject(curArg)) {
          throw new globalObject.TypeError(
            "Failed to execute 'sequenceConsumer' on 'SeqAndRec': parameter 1" + " is not an iterable object."
          );
        } else {
          const V = [];
          const tmp = curArg;
          for (let nextItem of tmp) {
            nextItem = conversions["USVString"](nextItem, {
              context: "Failed to execute 'sequenceConsumer' on 'SeqAndRec': parameter 1" + "'s element",
              globals: globalObject
            });

            V.push(nextItem);
          }
          curArg = V;
        }
        args.push(curArg);
      }
      return esValue[implSymbol].sequenceConsumer(...args);
    }

    sequenceConsumer2(seq) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'sequenceConsumer2' called on an object that is not a valid instance of SeqAndRec."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'sequenceConsumer2' on 'SeqAndRec': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (!utils.isObject(curArg)) {
          throw new globalObject.TypeError(
            "Failed to execute 'sequenceConsumer2' on 'SeqAndRec': parameter 1" + " is not an iterable object."
          );
        } else {
          const V = [];
          const tmp = curArg;
          for (let nextItem of tmp) {
            nextItem = utils.tryImplForWrapper(nextItem);

            V.push(nextItem);
          }
          curArg = V;
        }
        args.push(curArg);
      }
      return esValue[implSymbol].sequenceConsumer2(...args);
    }

    asyncSequenceConsumer(async_seq) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'asyncSequenceConsumer' called on an object that is not a valid instance of SeqAndRec."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'asyncSequenceConsumer' on 'SeqAndRec': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = utils.convertAsyncSequence(
          curArg,
          function (item) {
            item = conversions["USVString"](item, {
              context: "Failed to execute 'asyncSequenceConsumer' on 'SeqAndRec': parameter 1" + "'s element",
              globals: globalObject
            });
            return item;
          },
          "Failed to execute 'asyncSequenceConsumer' on 'SeqAndRec': parameter 1"
        );
        args.push(curArg);
      }
      return esValue[implSymbol].asyncSequenceConsumer(...args);
    }

    asyncSequenceConsumer2(async_seq) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'asyncSequenceConsumer2' called on an object that is not a valid instance of SeqAndRec."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'asyncSequenceConsumer2' on 'SeqAndRec': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = utils.convertAsyncSequence(
          curArg,
          function (item) {
            item = utils.tryImplForWrapper(item);
            return item;
          },
          "Failed to execute 'asyncSequenceConsumer2' on 'SeqAndRec': parameter 1"
        );
        args.push(curArg);
      }
      return esValue[implSymbol].asyncSequenceConsumer2(...args);
    }

    frozenArrayConsumer(arr) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'frozenArrayConsumer' called on an object that is not a valid instance of SeqAndRec."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'frozenArrayConsumer' on 'SeqAndRec': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        if (!utils.isObject(curArg)) {
          throw new globalObject.TypeError(
            "Failed to execute 'frozenArrayConsumer' on 'SeqAndRec': parameter 1" + " is not an iterable object."
          );
        } else {
          const V = [];
          const tmp = curArg;
          for (let nextItem of tmp) {
            nextItem = conversions["double"](nextItem, {
              context: "Failed to execute 'frozenArrayConsumer' on 'SeqAndRec': parameter 1" + "'s element",
              globals: globalObject
            });

            V.push(nextItem);
          }
          curArg = V;
        }
        curArg = Object.freeze(curArg);
        args.push(curArg);
      }
      return esValue[implSymbol].frozenArrayConsumer(...args);
    }

    asyncSequencePassthrough(async_seq) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'asyncSequencePassthrough' called on an object that is not a valid instance of SeqAndRec."
        );
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'asyncSequencePassthrough' on 'SeqAndRec': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = utils.convertAsyncSequence(
          curArg,
          function (item) {
            item = conversions["double"](item, {
              context: "Failed to execute 'asyncSequencePassthrough' on 'SeqAndRec': parameter 1" + "'s element",
              globals: globalObject
            });
            return item;
          },
          "Failed to execute 'asyncSequencePassthrough' on 'SeqAndRec': parameter 1"
        );
        args.push(curArg);
      }
      return utils.tryWrapperForImpl(esValue[implSymbol].asyncSequencePassthrough(...args));
    }
  }
  Object.defineProperties(SeqAndRec.prototype, {
    recordConsumer: { enumerable: true },
    recordConsumer2: { enumerable: true },
    sequenceConsumer: { enumerable: true },
    sequenceConsumer2: { enumerable: true },
    asyncSequenceConsumer: { enumerable: true },
    asyncSequenceConsumer2: { enumerable: true },
    frozenArrayConsumer: { enumerable: true },
    asyncSequencePassthrough: { enumerable: true },
    [Symbol.toStringTag]: { value: "SeqAndRec", configurable: true }
  });
  ctorRegistry[interfaceName] = SeqAndRec;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: SeqAndRec
  });
};

const Impl = require("../implementations/SeqAndRec.js");
