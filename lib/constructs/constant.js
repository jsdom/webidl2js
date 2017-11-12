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
    const body = `
      Object.defineProperty(${this.interface.name}, "${this.idl.name}", {
        value: ${utils.getDefault(this.idl.value)},
        enumerable: true
      });
      Object.defineProperty(${this.interface.name}.prototype, "${this.idl.name}", {
        value: ${utils.getDefault(this.idl.value)},
        enumerable: true
      });
    `;
    return {
      requires: new utils.RequiresMap(this.ctx),
      body
    };
  }
}

module.exports = Constant;
