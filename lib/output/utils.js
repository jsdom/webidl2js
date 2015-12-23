"use strict";

module.exports.mixin = function mixin(target, source) {
  const keys = Object.getOwnPropertyNames(source);
  const idx = keys.indexOf("constructor");
  if (idx !== -1) {
    keys.splice(idx, 1); // don't copy constructor property
  }
  for (let i = 0; i < keys.length; ++i) {
    Object.defineProperty(target, keys[i], Object.getOwnPropertyDescriptor(source, keys[i]));
  }
};

module.exports.wrapperSymbol = Symbol("wrapper");
module.exports.implSymbol = Symbol("impl");

module.exports.wrapperForImpl = function (impl) {
  return impl ? impl[module.exports.wrapperSymbol] : undefined;
};

module.exports.implForWrapper = function (wrapper) {
  return wrapper ? wrapper[module.exports.implSymbol] : undefined;
};

