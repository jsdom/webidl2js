"use strict";

const utils = require("../utils");

class Constant {
  constructor(ctx, I, idl) {
    this.ctx = ctx;
    this.interface = I;
    this.idl = idl;

    this.str = null;
  }

  generate() {
    this.interface.addStaticProperty(this.idl.name, utils.getDefault(this.idl.value), {
      configurable: false,
      writable: false
    });
    this.interface.addProperty(this.interface.defaultWhence, this.idl.name, utils.getDefault(this.idl.value), {
      configurable: false,
      writable: false
    });
    return { requires: new utils.RequiresMap(this.ctx) };
  }
}

module.exports = Constant;
