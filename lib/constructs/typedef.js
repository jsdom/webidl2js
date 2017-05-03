"use strict";

const Types = require("../types");

class Typedef {
  constructor(ctx, idl) {
    this.ctx = ctx;
    this.idlOrig = idl;
    this.idl = null;
    this.name = idl.name;
    this.resolved = false;
  }

  resolve(stack = []) {
    if (this.idl !== null) {
      return this.idl;
    }
    if (stack.includes(this.name)) {
      throw new Error(`Circular dependency in typedefs: ${stack.join(" -> ")} -> ${this.name}`);
    }
    stack.push(this.name);
    this.idl = Types.resolveType(this.ctx, this.idlOrig.idlType, stack);
    stack.pop();
    this.idlOrig = null;
    return this.idl;
  }
}

module.exports = Typedef;
