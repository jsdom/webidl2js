"use strict";

// Returns "Type(value) is Object" in ES terminology.
function isObject(value) {
  return typeof value === "object" && value !== null || typeof value === "function";
}

function hasOwn(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

const wrapperSymbol = Symbol("wrapper");
const implSymbol = Symbol("impl");
const sameObjectCaches = Symbol("SameObject caches");
const ctorRegistrySymbol = Symbol.for("[webidl2js]  constructor registry");

/**
 * @template T
 * @param {object} wrapper
 * @param {PropertyKey} prop
 * @param {() => T} creator
 * @return {T}
 */
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

function wrapperForImpl(impl) {
  return impl ? impl[wrapperSymbol] : null;
}

function implForWrapper(wrapper) {
  return wrapper ? wrapper[implSymbol] : null;
}

function tryWrapperForImpl(impl) {
  const wrapper = wrapperForImpl(impl);
  return wrapper ? wrapper : impl;
}

function tryImplForWrapper(wrapper) {
  const impl = implForWrapper(wrapper);
  return impl ? impl : wrapper;
}

const iterInternalSymbol = Symbol("internal");
/** @type {Iterable<any>} */
const IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));

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

const byteLengthGetter =
    Object.getOwnPropertyDescriptor(ArrayBuffer.prototype, "byteLength").get;

/** @return {value is ArrayBuffer} */
function isArrayBuffer(value) {
  try {
    byteLengthGetter.call(value);
    return true;
  } catch (e) {
    return false;
  }
}

const supportsPropertyIndex = Symbol("supports property index");
const supportedPropertyIndices = Symbol("supported property indices");
const supportsPropertyName = Symbol("supports property name");
const supportedPropertyNames = Symbol("supported property names");
const indexedGet = Symbol("indexed property get");
const indexedSetNew = Symbol("indexed property set new");
const indexedSetExisting = Symbol("indexed property set existing");
const namedGet = Symbol("named property get");
const namedSetNew = Symbol("named property set new");
const namedSetExisting = Symbol("named property set existing");
const namedDelete = Symbol("named property delete");

module.exports = exports = {
  isObject,
  hasOwn,
  /** @type {typeof wrapperSymbol} */
  wrapperSymbol,
  /** @type {typeof implSymbol} */
  implSymbol,
  getSameObject,
  /** @type {typeof ctorRegistrySymbol} */
  ctorRegistrySymbol,
  wrapperForImpl,
  implForWrapper,
  tryWrapperForImpl,
  tryImplForWrapper,
  /** @type {typeof iterInternalSymbol} */
  iterInternalSymbol,
  IteratorPrototype,
  isArrayBuffer,
  isArrayIndexPropName,
  /** @type {typeof supportsPropertyIndex} */
  supportsPropertyIndex,
  /** @type {typeof supportedPropertyIndices} */
  supportedPropertyIndices,
  /** @type {typeof supportsPropertyName} */
  supportsPropertyName,
  /** @type {typeof supportedPropertyNames} */
  supportedPropertyNames,
  /** @type {typeof indexedGet} */
  indexedGet,
  /** @type {typeof indexedSetNew} */
  indexedSetNew,
  /** @type {typeof indexedSetExisting} */
  indexedSetExisting,
  /** @type {typeof namedGet} */
  namedGet,
  /** @type {typeof namedSetNew} */
  namedSetNew,
  /** @type {typeof namedSetExisting} */
  namedSetExisting,
  /** @type {typeof namedDelete} */
  namedDelete
};
