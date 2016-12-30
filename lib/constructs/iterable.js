"use strict";

const conversions = require("webidl-conversions");
const keywords = require("../keywords");

function Iterable(obj, I, idl, opts) {
  this.obj = obj;
  this.interface = I;
  this.idl = idl;
  this.name = idl.type;
  this.opts = opts;
}

Iterable.prototype.generateFunction = function (key, kind, keyExpr, fnName) {
  if (fnName === undefined) {
    fnName = typeof key === "symbol" ? "" : (keywords.has(key) ? "_" : key);
  }

  const propExpr = typeof key === "symbol" ? `[${keyExpr}]` : `.${key}`;

  return `\n${this.obj.name}.prototype${propExpr} = function ${fnName}() {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }
  return module.exports.createDefaultIterator(this, "${kind}");
}`;
};

Iterable.prototype.generate = function () {
  const isPairIterator = Array.isArray(this.idl.idlType) && this.idl.idlType.length === 2;
  let str = "";

  if (isPairIterator) {
    str += this.generateFunction(Symbol.iterator, "key+value", "Symbol.iterator", "entries");
    str += `\n${this.obj.name}.prototype.entries = ${this.obj.name}.prototype[Symbol.iterator];`;
    str += this.generateFunction("keys", "key");
    str += this.generateFunction("values", "value");
    str += `\n${this.obj.name}.prototype.forEach = function forEach(callback) {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }
  if (arguments.length < 1) {
    throw new TypeError("Failed to execute 'forEach' on '${this.obj.name}': 1 argument required, but only 0 present.");
  }
  if (typeof callback !== "function") {
    throw new TypeError("Failed to execute 'forEach' on '${this.obj.name}': The callback provided as parameter 1 is not a function.");
  }
  const thisArg = arguments[1];
  let pairs = Array.from(this[impl]);
  let i = 0;
  while (i < pairs.length) {
    const [key, value] = pairs[i];
    callback.call(thisArg, value, key, this);
    pairs = Array.from(this[impl]);
    i++;
  }
};`;
  }


  return {
    requires: {},
    body: str
  }
};

module.exports = Iterable;
