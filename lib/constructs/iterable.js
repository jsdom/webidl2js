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

  get isAsync() {
    return false;
  }

  generateFunction(key, kind) {
    this.interface.addMethod(this.interface.defaultWhence, key, [], `
      if (!exports.is(this)) {
        throw new globalObject.TypeError("'${key}' called on an object that is not a valid instance of ${this.interface.name}.");
      }
      return exports.createDefaultIterator(globalObject, this, "${kind}");
    `);
  }

  generate() {
    const whence = this.interface.defaultWhence;
    const requires = new utils.RequiresMap(this.ctx);

    if (this.isPair) {
      this.generateFunction("keys", "key");
      this.generateFunction("values", "value");
      this.generateFunction("entries", "key+value");
      this.interface.addProperty(whence, Symbol.iterator, `${this.interface.name}.prototype.entries`);
      this.interface.addMethod(whence, "forEach", ["callback"], `
        if (!exports.is(this)) {
          throw new globalObject.TypeError("'forEach' called on an object that is not a valid instance of ${this.interface.name}.");
        }
        if (arguments.length < 1) {
          throw new globalObject.TypeError("Failed to execute 'forEach' on '${this.name}': 1 argument required, but only 0 present.");
        }
        callback = ${requires.addRelative("Function")}.convert(globalObject, callback, {
          context: "Failed to execute 'forEach' on '${this.name}': The callback provided as parameter 1"
        });
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
      this.interface.addProperty(whence, "keys", "globalObject.Array.prototype.keys");
      this.interface.addProperty(whence, "values", "globalObject.Array.prototype.values");
      this.interface.addProperty(whence, "entries", "globalObject.Array.prototype.entries");
      this.interface.addProperty(whence, "forEach", "globalObject.Array.prototype.forEach");
      // @@iterator is added in Interface class.
    }

    return { requires };
  }
}

module.exports = Iterable;
