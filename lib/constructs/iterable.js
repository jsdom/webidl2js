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
    const isPairIterator = utils.isPairIterable(this.idl);
    let str = "";

    if (isPairIterator) {
      str += `
        ${this.generateFunction(Symbol.iterator, "key+value", "Symbol.iterator", "entries")}
        ${this.obj.name}.prototype.entries = ${this.obj.name}.prototype[Symbol.iterator];
        ${this.generateFunction("keys", "key")}
        ${this.generateFunction("values", "value")}
        ${this.obj.name}.prototype.forEach = function forEach(callback) {
          if (!this || !module.exports.is(this)) {
            throw new TypeError("Illegal invocation");
          }
          if (arguments.length < 1) {
            throw new TypeError("Failed to execute 'forEach' on '${this.obj.name}': 1 argument required, " +
                                "but only 0 present.");
          }
          if (typeof callback !== "function") {
            throw new TypeError("Failed to execute 'forEach' on '${this.obj.name}': The callback provided " +
                                "as parameter 1 is not a function.");
          }
          const thisArg = arguments[1];
          let pairs = Array.from(this[impl]);
          let i = 0;
          while (i < pairs.length) {
            const [key, value] = pairs[i].map(utils.tryWrapperForImpl);
            callback.call(thisArg, value, key, this);
            pairs = Array.from(this[impl]);
            i++;
          }
        };
      `;
    } else {
      // value iterator; WIP
    }

    return {
      requires: {},
      body: str
    };
  }
}

module.exports = Iterable;
