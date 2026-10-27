"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const VoidFunction = require("./VoidFunction.js");
const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "ObservableArrays";

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
  throw new globalObject.TypeError(`${context} is not of type 'ObservableArrays'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["ObservableArrays"].prototype;
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
exports._initializeObservableArrays = (impl, globalObject) => {
  utils.initObservableArray(impl, globalObject, "names", value => {
    value = conversions["DOMString"](value, {
      context: "Failed to modify the 'names' observable array on 'ObservableArrays': The provided value",
      globals: globalObject
    });

    return value;
  });

  utils.initObservableArray(impl, globalObject, "readonlyNames", value => {
    value = conversions["DOMString"](value, {
      context: "Failed to modify the 'readonlyNames' observable array on 'ObservableArrays': The provided value",
      globals: globalObject
    });

    return value;
  });

  utils.initObservableArray(impl, globalObject, "employees", value => {
    if (value === null || value === undefined) {
      value = null;
    } else {
      value = exports.convert(globalObject, value, {
        context: "Failed to modify the 'employees' observable array on 'ObservableArrays': The provided value"
      });
    }
    return value;
  });

  utils.initObservableArray(impl, globalObject, "callbacks", value => {
    value = VoidFunction.convert(globalObject, value, {
      context: "Failed to modify the 'callbacks' observable array on 'ObservableArrays': The provided value"
    });

    return value;
  });

  utils.initObservableArray(impl, globalObject, "groups", value => {
    if (!utils.isObject(value)) {
      throw new globalObject.TypeError(
        "Failed to modify the 'groups' observable array on 'ObservableArrays': The provided value" +
          " is not an iterable object."
      );
    } else {
      const V = [];
      const tmp = value;
      for (let nextItem of tmp) {
        nextItem = conversions["DOMString"](nextItem, {
          context:
            "Failed to modify the 'groups' observable array on 'ObservableArrays': The provided value" + "'s element",
          globals: globalObject
        });

        V.push(nextItem);
      }
      value = V;
    }
    value = Object.freeze(value);
    return value;
  });

  utils.initObservableArray(impl, globalObject, "numbers", value => {
    value = conversions["long"](value, {
      context: "Failed to modify the 'numbers' observable array on 'ObservableArrays': The provided value",
      globals: globalObject
    });

    return value;
  });
};
exports.setup = (wrapper, globalObject, constructorArgs = [], privateData = {}) => {
  privateData.wrapper = wrapper;

  exports._internalSetup(wrapper, globalObject);
  const impl = new Impl.implementation(globalObject, constructorArgs, privateData);

  utils.registerWrapper(wrapper, impl, $interfaceDescriptor);
  impl[utils.wrapperSymbol] = wrapper;
  exports._initializeObservableArrays(impl, globalObject);
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
  exports._initializeObservableArrays(impl, globalObject);
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
  class ObservableArrays {
    constructor() {
      return exports.setup(Object.create(new.target.prototype), globalObject, undefined);
    }

    get names() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get names");
      return utils.getObservableArray($impl, "names");
    }

    set names(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set names");
      let value = V;
      if (!utils.isObject(value)) {
        throw new globalObject.TypeError(
          "Failed to set the 'names' property on 'ObservableArrays': The provided value" + " is not an iterable object."
        );
      } else {
        const V = [];
        const tmp = value;
        for (let nextItem of tmp) {
          nextItem = conversions["DOMString"](nextItem, {
            context: "Failed to set the 'names' property on 'ObservableArrays': The provided value" + "'s element",
            globals: globalObject
          });

          V.push(nextItem);
        }
        value = V;
      }

      utils.setObservableArray($impl, "names", value);
    }

    get readonlyNames() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get readonlyNames");
      return utils.getObservableArray($impl, "readonlyNames");
    }

    get employees() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get employees");
      return utils.getObservableArray($impl, "employees");
    }

    set employees(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set employees");
      let value = V;
      if (!utils.isObject(value)) {
        throw new globalObject.TypeError(
          "Failed to set the 'employees' property on 'ObservableArrays': The provided value" +
            " is not an iterable object."
        );
      } else {
        const V = [];
        const tmp = value;
        for (let nextItem of tmp) {
          if (nextItem === null || nextItem === undefined) {
            nextItem = null;
          } else {
            nextItem = exports.convert(globalObject, nextItem, {
              context: "Failed to set the 'employees' property on 'ObservableArrays': The provided value" + "'s element"
            });
          }
          V.push(nextItem);
        }
        value = V;
      }

      utils.setObservableArray($impl, "employees", value);
    }

    get callbacks() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get callbacks");
      return utils.getObservableArray($impl, "callbacks");
    }

    set callbacks(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set callbacks");
      let value = V;
      if (!utils.isObject(value)) {
        throw new globalObject.TypeError(
          "Failed to set the 'callbacks' property on 'ObservableArrays': The provided value" +
            " is not an iterable object."
        );
      } else {
        const V = [];
        const tmp = value;
        for (let nextItem of tmp) {
          nextItem = VoidFunction.convert(globalObject, nextItem, {
            context: "Failed to set the 'callbacks' property on 'ObservableArrays': The provided value" + "'s element"
          });

          V.push(nextItem);
        }
        value = V;
      }

      utils.setObservableArray($impl, "callbacks", value);
    }

    get groups() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get groups");
      return utils.getObservableArray($impl, "groups");
    }

    set groups(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set groups");
      let value = V;
      if (!utils.isObject(value)) {
        throw new globalObject.TypeError(
          "Failed to set the 'groups' property on 'ObservableArrays': The provided value" +
            " is not an iterable object."
        );
      } else {
        const V = [];
        const tmp = value;
        for (let nextItem of tmp) {
          if (!utils.isObject(nextItem)) {
            throw new globalObject.TypeError(
              "Failed to set the 'groups' property on 'ObservableArrays': The provided value" +
                "'s element" +
                " is not an iterable object."
            );
          } else {
            const V = [];
            const tmp = nextItem;
            for (let nextItem of tmp) {
              nextItem = conversions["DOMString"](nextItem, {
                context:
                  "Failed to set the 'groups' property on 'ObservableArrays': The provided value" +
                  "'s element" +
                  "'s element",
                globals: globalObject
              });

              V.push(nextItem);
            }
            nextItem = V;
          }
          nextItem = Object.freeze(nextItem);
          V.push(nextItem);
        }
        value = V;
      }

      utils.setObservableArray($impl, "groups", value);
    }

    get numbers() {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "get numbers");
      return utils.getObservableArray($impl, "numbers");
    }

    set numbers(V) {
      const $impl = $requireImpl(this ?? globalObject, globalObject, "set numbers");
      let value = V;
      if (!utils.isObject(value)) {
        throw new globalObject.TypeError(
          "Failed to set the 'numbers' property on 'ObservableArrays': The provided value" +
            " is not an iterable object."
        );
      } else {
        const V = [];
        const tmp = value;
        for (let nextItem of tmp) {
          nextItem = conversions["long"](nextItem, {
            context: "Failed to set the 'numbers' property on 'ObservableArrays': The provided value" + "'s element",
            globals: globalObject
          });

          V.push(nextItem);
        }
        value = V;
      }

      utils.setObservableArray($impl, "numbers", value);
    }
  }
  Object.defineProperties(ObservableArrays.prototype, {
    names: { enumerable: true },
    readonlyNames: { enumerable: true },
    employees: { enumerable: true },
    callbacks: { enumerable: true },
    groups: { enumerable: true },
    numbers: { enumerable: true },
    [Symbol.toStringTag]: { value: "ObservableArrays", configurable: true }
  });
  ctorRegistry[interfaceName] = ObservableArrays;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: ObservableArrays
  });
};

const Impl = require("../implementations/ObservableArrays.js");
