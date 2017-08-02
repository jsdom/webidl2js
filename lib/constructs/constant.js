"use strict";

class Constant {
  constructor(ctx, obj, I, idl) {
    this.ctx = ctx;
    this.obj = obj;
    this.interface = I;
    this.idl = idl;

    this.str = null;
  }

  generate() {
    const body = `
      Object.defineProperty(${this.obj.name}, "${this.idl.name}", {
        value: ${JSON.stringify(this.idl.value.value)},
        enumerable: true
      });
      Object.defineProperty(${this.obj.name}.prototype, "${this.idl.name}", {
        value: ${JSON.stringify(this.idl.value.value)},
        enumerable: true
      });
    `;
    return {
      requires: {},
      body
    };
  }
}

module.exports = Constant;
