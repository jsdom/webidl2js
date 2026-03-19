"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const URL = require("./URL.js");
const implSymbol = utils.implSymbol;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "Variadic";

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
  throw new globalObject.TypeError(`${context} is not of type 'Variadic'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["Variadic"].prototype;
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
  class Variadic {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    simple1() {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'simple1' called on an object that is not a valid instance of Variadic.");
      }
      const args = [];
      for (let i = 0; i < arguments.length; i++) {
        let curArg = arguments[i];
        curArg = conversions["DOMString"](curArg, {
          context: "Failed to execute 'simple1' on 'Variadic': parameter " + (i + 1),
          globals: globalObject
        });
        args.push(curArg);
      }
      return esValue[implSymbol].simple1(...args);
    }

    simple2(first) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'simple2' called on an object that is not a valid instance of Variadic.");
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'simple2' on 'Variadic': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["DOMString"](curArg, {
          context: "Failed to execute 'simple2' on 'Variadic': parameter 1",
          globals: globalObject
        });
        args.push(curArg);
      }
      for (let i = 1; i < arguments.length; i++) {
        let curArg = arguments[i];
        curArg = URL.convert(globalObject, curArg, {
          context: "Failed to execute 'simple2' on 'Variadic': parameter " + (i + 1)
        });
        args.push(curArg);
      }
      return esValue[implSymbol].simple2(...args);
    }

    overloaded1() {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'overloaded1' called on an object that is not a valid instance of Variadic.");
      }
      const args = [];
      switch (arguments.length) {
        case 0:
          break;
        default: {
          let curArg = arguments[0];
          if (typeof curArg === "number") {
            for (let i = 0; i < arguments.length; i++) {
              let curArg = arguments[i];
              curArg = conversions["unsigned long"](curArg, {
                context: "Failed to execute 'overloaded1' on 'Variadic': parameter " + (i + 1),
                globals: globalObject
              });
              args.push(curArg);
            }
          } else {
            for (let i = 0; i < arguments.length; i++) {
              let curArg = arguments[i];
              curArg = conversions["DOMString"](curArg, {
                context: "Failed to execute 'overloaded1' on 'Variadic': parameter " + (i + 1),
                globals: globalObject
              });
              args.push(curArg);
            }
          }
        }
      }
      return esValue[implSymbol].overloaded1(...args);
    }

    overloaded2(first) {
      const esValue = this !== null && this !== undefined ? this : globalObject;
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'overloaded2' called on an object that is not a valid instance of Variadic.");
      }

      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to execute 'overloaded2' on 'Variadic': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      switch (arguments.length) {
        case 1:
          {
            let curArg = arguments[0];
            if (typeof curArg === "number") {
              {
                let curArg = arguments[0];
                curArg = conversions["unsigned long"](curArg, {
                  context: "Failed to execute 'overloaded2' on 'Variadic': parameter 1",
                  globals: globalObject
                });
                args.push(curArg);
              }
            } else {
              {
                let curArg = arguments[0];
                curArg = conversions["DOMString"](curArg, {
                  context: "Failed to execute 'overloaded2' on 'Variadic': parameter 1",
                  globals: globalObject
                });
                args.push(curArg);
              }
            }
          }
          break;
        default: {
          let curArg = arguments[0];
          if (typeof curArg === "number") {
            {
              let curArg = arguments[0];
              curArg = conversions["unsigned long"](curArg, {
                context: "Failed to execute 'overloaded2' on 'Variadic': parameter 1",
                globals: globalObject
              });
              args.push(curArg);
            }
            for (let i = 1; i < arguments.length; i++) {
              let curArg = arguments[i];
              curArg = conversions["DOMString"](curArg, {
                context: "Failed to execute 'overloaded2' on 'Variadic': parameter " + (i + 1),
                globals: globalObject
              });
              args.push(curArg);
            }
          } else {
            {
              let curArg = arguments[0];
              curArg = conversions["DOMString"](curArg, {
                context: "Failed to execute 'overloaded2' on 'Variadic': parameter 1",
                globals: globalObject
              });
              args.push(curArg);
            }
            for (let i = 1; i < arguments.length; i++) {
              let curArg = arguments[i];
              curArg = conversions["DOMString"](curArg, {
                context: "Failed to execute 'overloaded2' on 'Variadic': parameter " + (i + 1),
                globals: globalObject
              });
              args.push(curArg);
            }
          }
        }
      }
      return esValue[implSymbol].overloaded2(...args);
    }
  }
  Object.defineProperties(Variadic.prototype, {
    simple1: { enumerable: true },
    simple2: { enumerable: true },
    overloaded1: { enumerable: true },
    overloaded2: { enumerable: true },
    [Symbol.toStringTag]: { value: "Variadic", configurable: true }
  });
  ctorRegistry[interfaceName] = Variadic;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: Variadic
  });
};

const Impl = require("../implementations/Variadic.js");
