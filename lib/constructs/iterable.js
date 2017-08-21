"use strict";

const keywords = require("../keywords");
const utils = require("../utils");

class Iterable {
  constructor(ctx, obj, I, idl) {
    this.ctx = ctx;
    this.obj = obj;
    this.interface = I;
    this.idl = idl;
    this.name = idl.type;
  }

  get isValue() {
    return !Array.isArray(this.idl.idlType);
  }

  get isPair() {
    return Array.isArray(this.idl.idlType) && this.idl.idlType.length === 2;
  }

  generateFunction(key, kind, keyExpr, fnName) {
    if (fnName === undefined) {
      if (typeof key === "symbol") {
        fnName = "";
      } else {
        fnName = keywords.has(key) ? "_" : key;
      }
    }

    const propExpr = typeof key === "symbol" ? `[${keyExpr}]` : `.${key}`;

    return `
      ${this.obj.name}.prototype${propExpr} = function ${fnName}() {
        if (!this || !module.exports.is(this)) {
          throw new TypeError("Illegal invocation");
        }
        return module.exports.createDefaultIterator(this, "${kind}");
      };
    `;
  }

  generate() {
    let str = "";

    if (this.isPair) {
      str += `
        ${this.obj.name}.prototype.entries = ${this.obj.name}.prototype[Symbol.iterator];
        ${this.generateFunction("keys", "key")}
        ${this.generateFunction("values", "value")}
      `;
    } else {
      str += `
        ${this.obj.name}.prototype.entries = Array.prototype.entries;
        ${this.obj.name}.prototype.keys = Array.prototype.keys;
        ${this.obj.name}.prototype.values = Array.prototype[Symbol.iterator];
      `;
    }

    return {
      requires: new utils.RequiresMap(this.ctx),
      body: str
    };
  }
}

module.exports = Iterable;
