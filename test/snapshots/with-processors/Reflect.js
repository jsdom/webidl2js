"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const whatwg_url = require("whatwg-url");
const implSymbol = utils.implSymbol;
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "Reflect";

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
  throw new globalObject.TypeError(`${context} is not of type 'Reflect'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["Reflect"].prototype;
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
  class Reflect {
    constructor() {
      throw new globalObject.TypeError("Illegal constructor");
    }

    get reflectedBoolean() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get reflectedBoolean' called on an object that is not a valid instance of Reflect."
        );
      }

      return esValue[implSymbol].hasAttributeNS(null, "reflectedboolean");
    }

    set reflectedBoolean(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set reflectedBoolean' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["boolean"](V, {
        context: "Failed to set the 'reflectedBoolean' property on 'Reflect': The provided value",
        globals: globalObject
      });

      if (V) {
        esValue[implSymbol].setAttributeNS(null, "reflectedboolean", "");
      } else {
        esValue[implSymbol].removeAttributeNS(null, "reflectedboolean");
      }
    }

    get reflectedDOMString() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get reflectedDOMString' called on an object that is not a valid instance of Reflect."
        );
      }

      const value = esValue[implSymbol].getAttributeNS(null, "reflecteddomstring");
      return value === null ? "" : value;
    }

    set reflectedDOMString(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set reflectedDOMString' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'reflectedDOMString' property on 'Reflect': The provided value",
        globals: globalObject
      });

      esValue[implSymbol].setAttributeNS(null, "reflecteddomstring", V);
    }

    get reflectedLong() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get reflectedLong' called on an object that is not a valid instance of Reflect."
        );
      }

      const value = parseInt(esValue[implSymbol].getAttributeNS(null, "reflectedlong"));
      return isNaN(value) || value < -2147483648 || value > 2147483647 ? 0 : value;
    }

    set reflectedLong(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set reflectedLong' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["long"](V, {
        context: "Failed to set the 'reflectedLong' property on 'Reflect': The provided value",
        globals: globalObject
      });

      esValue[implSymbol].setAttributeNS(null, "reflectedlong", String(V));
    }

    get reflectedUnsignedLong() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get reflectedUnsignedLong' called on an object that is not a valid instance of Reflect."
        );
      }

      const value = parseInt(esValue[implSymbol].getAttributeNS(null, "reflectedunsignedlong"));
      return isNaN(value) || value < 0 || value > 2147483647 ? 0 : value;
    }

    set reflectedUnsignedLong(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set reflectedUnsignedLong' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["unsigned long"](V, {
        context: "Failed to set the 'reflectedUnsignedLong' property on 'Reflect': The provided value",
        globals: globalObject
      });

      esValue[implSymbol].setAttributeNS(null, "reflectedunsignedlong", String(V > 2147483647 ? 0 : V));
    }

    get reflectedUSVStringURL() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get reflectedUSVStringURL' called on an object that is not a valid instance of Reflect."
        );
      }

      const value = esValue[implSymbol].getAttributeNS(null, "reflectedusvstringurl");
      if (value === null) {
        return "";
      }
      const urlRecord = whatwg_url.parseURL(value, { baseURL: "http://localhost:8080/" });
      return urlRecord === null ? conversions.USVString(value) : whatwg_url.serializeURL(urlRecord);
    }

    set reflectedUSVStringURL(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set reflectedUSVStringURL' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["USVString"](V, {
        context: "Failed to set the 'reflectedUSVStringURL' property on 'Reflect': The provided value",
        globals: globalObject
      });

      esValue[implSymbol].setAttributeNS(null, "reflectedusvstringurl", V);
    }

    get reflectionTest() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get reflectionTest' called on an object that is not a valid instance of Reflect."
        );
      }

      const value = esValue[implSymbol].getAttributeNS(null, "reflection");
      return value === null ? "" : value;
    }

    set reflectionTest(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set reflectionTest' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'reflectionTest' property on 'Reflect': The provided value",
        globals: globalObject
      });

      esValue[implSymbol].setAttributeNS(null, "reflection", V);
    }

    get withUnderscore() {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'get withUnderscore' called on an object that is not a valid instance of Reflect."
        );
      }

      const value = esValue[implSymbol].getAttributeNS(null, "with-underscore");
      return value === null ? "" : value;
    }

    set withUnderscore(V) {
      const esValue = this !== null && this !== undefined ? this : globalObject;

      if (!exports.is(esValue)) {
        throw new globalObject.TypeError(
          "'set withUnderscore' called on an object that is not a valid instance of Reflect."
        );
      }

      V = conversions["DOMString"](V, {
        context: "Failed to set the 'withUnderscore' property on 'Reflect': The provided value",
        globals: globalObject
      });

      esValue[implSymbol].setAttributeNS(null, "with-underscore", V);
    }
  }
  Object.defineProperties(Reflect.prototype, {
    reflectedBoolean: { enumerable: true },
    reflectedDOMString: { enumerable: true },
    reflectedLong: { enumerable: true },
    reflectedUnsignedLong: { enumerable: true },
    reflectedUSVStringURL: { enumerable: true },
    reflectionTest: { enumerable: true },
    withUnderscore: { enumerable: true },
    [Symbol.toStringTag]: { value: "Reflect", configurable: true }
  });
  ctorRegistry[interfaceName] = Reflect;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: Reflect
  });
};

const Impl = require("../implementations/Reflect.js");
