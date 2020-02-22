"use strict";

// Returns "Type(value) is Object" in ES terminology.
exports.isObject = value => {
  return typeof value === "object" && value !== null || typeof value === "function";
};

exports.hasOwn = Function.prototype.call.bind(Object.prototype.hasOwnProperty);

const wrapperSymbol = Symbol("wrapper");
const implSymbol = Symbol("impl");

exports.wrapperSymbol = wrapperSymbol;
exports.implSymbol = implSymbol;
exports.ctorRegistrySymbol = Symbol.for("[webidl2js]  constructor registry");

const sameObjectCaches = Symbol("SameObject caches");
exports.getSameObject = (wrapper, prop, creator) => {
  if (!wrapper[sameObjectCaches]) {
    wrapper[sameObjectCaches] = Object.create(null);
  }

  if (prop in wrapper[sameObjectCaches]) {
    return wrapper[sameObjectCaches][prop];
  }

  wrapper[sameObjectCaches][prop] = creator();
  return wrapper[sameObjectCaches][prop];
};

function wrapperForImpl(impl) {
  return impl ? impl[wrapperSymbol] : null;
}

function implForWrapper(wrapper) {
  return wrapper ? wrapper[implSymbol] : null;
}

exports.wrapperForImpl = wrapperForImpl;
exports.tryWrapperForImpl = impl => {
  const wrapper = wrapperForImpl(impl);
  return wrapper ? wrapper : impl;
};

exports.implForWrapper = implForWrapper;
exports.tryImplForWrapper = wrapper => {
  const impl = implForWrapper(wrapper);
  return impl ? impl : wrapper;
};

exports.iterInternalSymbol = Symbol("internal");
exports.IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));

exports.isArrayIndexPropName = P => {
  if (typeof P !== "string") {
    return false;
  }
  const i = P >>> 0;
  if (i === Math.pow(2, 32) - 1) {
    return false;
  }
  const s = `${i}`;
  if (P !== s) {
    return false;
  }
  return true;
};

const byteLengthGetter =
    Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get;
exports.isArrayBuffer = value => {
  try {
    byteLengthGetter.call(value);
    return true;
  } catch (e) {
    return false;
  }
};

exports.supportsPropertyIndex = Symbol("supports property index");
exports.supportedPropertyIndices = Symbol("supported property indices");
exports.supportsPropertyName = Symbol("supports property name");
exports.supportedPropertyNames = Symbol("supported property names");
exports.indexedGet = Symbol("indexed property get");
exports.indexedSetNew = Symbol("indexed property set new");
exports.indexedSetExisting = Symbol("indexed property set existing");
exports.namedGet = Symbol("named property get");
exports.namedSetNew = Symbol("named property set new");
exports.namedSetExisting = Symbol("named property set existing");
exports.namedDelete = Symbol("named property delete");
