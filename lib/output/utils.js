"use strict";

// Returns "Type(value) is Object" in ES terminology.
function isObject(value) {
  return typeof value === "object" && value !== null || typeof value === "function";
}
exports.isObject = isObject;

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}
exports.hasOwn = hasOwn;

const wrapperSymbol = Symbol("wrapper");
exports.wrapperSymbol = wrapperSymbol;

const implSymbol = Symbol("impl");
exports.implSymbol = implSymbol;

const sameObjectCaches = Symbol("SameObject caches");
const ctorRegistrySymbol = Symbol.for("[webidl2js]  constructor registry");
exports.ctorRegistrySymbol = ctorRegistrySymbol;

function getSameObject(wrapper, prop, creator) {
  if (!wrapper[sameObjectCaches]) {
    wrapper[sameObjectCaches] = Object.create(null);
  }

  if (prop in wrapper[sameObjectCaches]) {
    return wrapper[sameObjectCaches][prop];
  }

  wrapper[sameObjectCaches][prop] = creator();
  return wrapper[sameObjectCaches][prop];
}
exports.getSameObject = getSameObject;

function wrapperForImpl(impl) {
  return impl ? impl[wrapperSymbol] : null;
}
exports.wrapperForImpl = wrapperForImpl;

function implForWrapper(wrapper) {
  return wrapper ? wrapper[implSymbol] : null;
}
exports.implForWrapper = implForWrapper;

function tryWrapperForImpl(impl) {
  const wrapper = wrapperForImpl(impl);
  return wrapper ? wrapper : impl;
}
exports.tryWrapperForImpl = tryWrapperForImpl;

function tryImplForWrapper(wrapper) {
  const impl = implForWrapper(wrapper);
  return impl ? impl : wrapper;
}
exports.tryImplForWrapper = tryImplForWrapper;

const iterInternalSymbol = Symbol("internal");
exports.iterInternalSymbol = iterInternalSymbol;

const IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));
exports.IteratorPrototype = IteratorPrototype;

function isArrayIndexPropName(P) {
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
}
exports.isArrayIndexPropName = isArrayIndexPropName;

const byteLengthGetter =
    Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get;
function isArrayBuffer(value) {
  try {
    byteLengthGetter.call(value);
    return true;
  } catch (e) {
    return false;
  }
}
exports.isArrayBuffer = isArrayBuffer;

const supportsPropertyIndex = Symbol("supports property index");
exports.supportsPropertyIndex = supportsPropertyIndex;

const supportedPropertyIndices = Symbol("supported property indices");
exports.supportedPropertyIndices = supportedPropertyIndices;

const supportsPropertyName = Symbol("supports property name");
exports.supportsPropertyName = supportsPropertyName;

const supportedPropertyNames = Symbol("supported property names");
exports.supportedPropertyNames = supportedPropertyNames;

const indexedGet = Symbol("indexed property get");
exports.indexedGet = indexedGet;

const indexedSetNew = Symbol("indexed property set new");
exports.indexedSetNew = indexedSetNew;

const indexedSetExisting = Symbol("indexed property set existing");
exports.indexedSetExisting = indexedSetExisting;

const namedGet = Symbol("named property get");
exports.namedGet = namedGet;

const namedSetNew = Symbol("named property set new");
exports.namedSetNew = namedSetNew;

const namedSetExisting = Symbol("named property set existing");
exports.namedSetExisting = namedSetExisting;

const namedDelete = Symbol("named property delete");
exports.namedDelete = namedDelete;
