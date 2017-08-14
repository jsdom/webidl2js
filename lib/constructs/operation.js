"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const Overloads = require("../overloads");
const Parameters = require("../parameters");
const keywords = require("../keywords");

class Operation {
  constructor(ctx, I, idl) {
    this.ctx = ctx;
    this.interface = I;
    this.idls = [idl];
    this.name = idl.name;
    this.static = idl.static;
  }

  isOnInstance() {
    const firstOverloadOnInstance = utils.isOnInstance(this.idls[0], this.interface.idl);
    for (const overload of this.idls.slice(1)) {
      if (utils.isOnInstance(overload, this.interface.idl) !== firstOverloadOnInstance) {
        throw new Error(`[Unforgeable] is not applied uniformly to operation "${this.name}" on ${this.interface.name}`);
      }
    }
    return firstOverloadOnInstance;
  }

  generate() {
    const requires = new utils.RequiresMap(this.ctx);
    let str = "";

    if (!this.name) {
      throw new Error(`Internal error: this operation does not have a name (in interface ${this.interface.name})`);
    }

    let targetObj = this.interface.name + (this.static ? "" : ".prototype");
    if (this.isOnInstance()) {
      targetObj = "obj";
    }

    const type = this.static ? "static operation" : "regular operation";
    const overloads = Overloads.getEffectiveOverloads(type, this.name, 0, this.interface);
    let minConstructor = overloads[0];

    for (let i = 1; i < overloads.length; ++i) {
      if (overloads[i].nameList.length < minConstructor.nameList.length) {
        minConstructor = overloads[i];
      }
    }

    const fnName = keywords.has(this.name) ? "_" : this.name;
    minConstructor.nameList = minConstructor.nameList.map(n => (keywords.has(n) ? "_" : "") + n);

    str += `
      ${targetObj}.${this.name} = function ${fnName}(${minConstructor.nameList.join(", ")}) {
    `;
    if (!this.static) {
      str += `
        if (!this || !module.exports.is(this)) {
          throw new TypeError("Illegal invocation");
        }
      `;
    }

    if (minConstructor.nameList.length !== 0) {
      const plural = minConstructor.nameList.length > 1 ? "s" : "";
      str += `
        if (arguments.length < ${minConstructor.nameList.length}) {
          throw new TypeError("Failed to execute '${this.name}' on '${this.interface.name}': " +
                              "${minConstructor.nameList.length} argument${plural} required, but only " +
                              arguments.length + " present.");
        }
      `;
    }

    const callOn = this.static ? "Impl" : "this[impl]";
    // In case of stringifiers, use the named implementation function rather than hardcoded "toString".
    // All overloads will have the same name, so pick the first one.
    const implFunc = this.idls[0].name || this.name;

    const parameterConversions = Parameters.generateOverloadConversions(
      this.ctx, overloads, this.interface.name, `Failed to execute '${this.name}' on '${this.interface.name}': `);
    const argsSpread = parameterConversions.hasArgs ? "...args" : "";
    requires.merge(parameterConversions.requires);
    str += parameterConversions.body;

    if (overloads.every(overload => conversions[overload.operation.idlType.idlType])) {
      str += `
          return ${callOn}.${implFunc}(${argsSpread});
        };
      `;
    } else {
      str += `
          return utils.tryWrapperForImpl(${callOn}.${implFunc}(${argsSpread}));
        };
      `;
    }

    return {
      requires,
      body: str
    };
  }
}

module.exports = Operation;
