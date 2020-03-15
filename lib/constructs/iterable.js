"use strict";

const utils = require("../utils");

class Iterable {
  constructor(ctx, I, idl) {
    this.ctx = ctx;
    this.interface = I;
    this.idl = idl;
    this.name = idl.type;
  }

  get isValue() {
    return this.idl.idlType.length === 1;
  }

  get isPair() {
    return this.idl.idlType.length === 2;
  }

  generateFunction(key, kind) {
    this.interface.addMethod(this.interface.defaultWhence, key, [], `
      if (!this || !exports.is(this)) {
        throw new TypeError("Illegal invocation");
      }
      return exports.createDefaultIterator(this, "${kind}");
    `);
  }

  generate() {
    const whence = this.interface.defaultWhence;
    if (this.isPair) {
      this.generateFunction("keys", "key");
      this.generateFunction("values", "value");
      this.generateFunction("entries", "key+value");
      this.interface.addProperty(whence, Symbol.iterator, `${this.interface.name}.prototype.entries`);
      this.interface.addMethod(whence, "forEach", ["callback"], `
        if (!this || !exports.is(this)) {
          throw new TypeError("Illegal invocation");
        }
        if (arguments.length < 1) {
          throw new TypeError("Failed to execute 'forEach' on '${this.name}': 1 argument required, " +
                              "but only 0 present.");
        }
        if (typeof callback !== "function") {
          throw new TypeError("Failed to execute 'forEach' on '${this.name}': The callback provided " +
                              "as parameter 1 is not a function.");
        }
        const thisArg = arguments[1];
        let pairs = Array.from(this[implSymbol]);
        let i = 0;
        while (i < pairs.length) {
          const [key, value] = pairs[i].map(utils.tryWrapperForImpl);
          callback.call(thisArg, value, key, this);
          pairs = Array.from(this[implSymbol]);
          i++;
        }
      `);
    } else {
      this.interface.addProperty(whence, "keys", "Array.prototype.keys");
      this.interface.addProperty(whence, "values", "Array.prototype[Symbol.iterator]");
      this.interface.addProperty(whence, "entries", "Array.prototype.entries");
      this.interface.addProperty(whence, "forEach", "Array.prototype.forEach");
      // @@iterator is added in Interface class.
    }

    return {
      requires: new utils.RequiresMap(this.ctx)
    };
  }
}

module.exports = Iterable;
