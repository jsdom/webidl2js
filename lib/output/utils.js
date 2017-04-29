"use strict";

module.exports.mixin = function mixin(target, source) {
  const keys = Object.getOwnPropertyNames(source);
  for (let i = 0; i < keys.length; ++i) {
    if (keys[i] in target) {
      continue;
    }

    Object.defineProperty(target, keys[i], Object.getOwnPropertyDescriptor(source, keys[i]));
  }
};

const wrapperSymbol = Symbol("wrapper");
const implSymbol = Symbol("impl");
const sameObjectCaches = Symbol("SameObject caches");

function getSameObject(wrapper, prop, creator) {
  if (!wrapper[sameObjectCaches]) {
    wrapper[sameObjectCaches] = Object.create(null);
  }

  if (prop in wrapper[sameObjectCaches]) {
    return wrapper[sameObjectCaches][prop];
  }

  return wrapper[sameObjectCaches][prop] = creator();
}

function wrapperForImpl(impl) {
  return impl ? impl[wrapperSymbol] : null;
};

function implForWrapper(wrapper) {
  return wrapper ? wrapper[implSymbol] : null;
};

function tryWrapperForImpl(impl) {
  const wrapper = wrapperForImpl(impl);
  return wrapper ? wrapper : impl;
};

function tryImplForWrapper(wrapper) {
  const impl = implForWrapper(wrapper);
  return impl ? impl : wrapper;
};

const iterInternalSymbol = Symbol("internal");
const IteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf([][Symbol.iterator]()));

module.exports.wrapperSymbol = wrapperSymbol;
module.exports.implSymbol = implSymbol;
module.exports.getSameObject = getSameObject;
module.exports.wrapperForImpl = wrapperForImpl;
module.exports.implForWrapper = implForWrapper;
module.exports.tryWrapperForImpl = tryWrapperForImpl;
module.exports.tryImplForWrapper = tryImplForWrapper;
module.exports.iterInternalSymbol = iterInternalSymbol;
module.exports.IteratorPrototype = IteratorPrototype;
