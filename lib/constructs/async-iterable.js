"use strict";

const utils = require("../utils");
const { generateAsyncIteratorArgConversions } = require("../parameters");

class AsyncIterable {
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
    return true;
  }

  get hasReturnSteps() {
    return Boolean(utils.getExtAttr(this.idl.extAttrs, "WebIDL2JSHasReturnSteps"));
  }

  generateFunction(key, kind, requires) {
    const conv = generateAsyncIteratorArgConversions(
      this.ctx,
      this.idl,
      this.interface,
      `Failed to execute '${key}' on '${this.interface.name}': `
    );
    requires.merge(conv.requires);

    this.interface.addMethod(this.interface.defaultWhence, key, [], `
      if (!exports.is(this)) {
        throw new globalObject.TypeError("'${key}' called on an object that is not a valid instance of ${this.interface.name}.");
      }

      ${conv.body}

      const asyncIterator = exports.createDefaultAsyncIterator(globalObject, this, "${kind}");
      if (this[implSymbol][utils.asyncIteratorInit]) {
        this[implSymbol][utils.asyncIteratorInit](asyncIterator, args);
      }
      return asyncIterator;
    `);
  }

  generate() {
    const whence = this.interface.defaultWhence;
    const requires = new utils.RequiresMap(this.ctx);

    // https://heycam.github.io/webidl/#define-the-asynchronous-iteration-methods

    if (this.isPair) {
      this.generateFunction("keys", "key", requires);
      this.generateFunction("values", "value", requires);
      this.generateFunction("entries", "key+value", requires);
      this.interface.addProperty(whence, Symbol.asyncIterator, `${this.interface.name}.prototype.entries`);
    } else {
      this.generateFunction("values", "value", requires);
      this.interface.addProperty(whence, Symbol.asyncIterator, `${this.interface.name}.prototype.values`);
    }

    return { requires };
  }
}

module.exports = AsyncIterable;
