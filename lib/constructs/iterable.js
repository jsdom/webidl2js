"use strict";

const keywords = require("../keywords");
const utils = require("../utils");

class Iterable {
  constructor(ctx, I, idl) {
    this.ctx = ctx;
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
      ${this.interface.name}.prototype${propExpr} = function ${fnName}() {
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
        ${this.interface.name}.prototype.entries = ${this.interface.name}.prototype[Symbol.iterator];
        ${this.generateFunction("keys", "key")}
        ${this.generateFunction("values", "value")}
      `;
    } else {
      str += `
        ${this.interface.name}.prototype.entries = Array.prototype.entries;
        ${this.interface.name}.prototype.keys = Array.prototype.keys;
        ${this.interface.name}.prototype.values = Array.prototype[Symbol.iterator];
      `;
    }

    return {
      requires: new utils.RequiresMap(this.ctx),
      body: str
    };
  }
}

module.exports = Iterable;
