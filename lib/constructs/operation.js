"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const Overloads = require("../overloads");
const Parameters = require("../parameters");
const keywords = require("../keywords");

class Operation {
  constructor(ctx, obj, I, idl) {
    this.ctx = ctx;
    this.obj = obj;
    this.interface = I;
    this.idl = idl;
    this.name = idl.name;
    this.static = idl.static;
  }

  generate() {
    const requires = new utils.RequiresMap(this.ctx);
    let str = "";

    if (!this.name) {
      throw new Error(`Internal error: this operation does not have a name (in interface ${this.obj.name})`);
    }

    let targetObj = this.obj.name + (this.static ? "" : ".prototype");
    if (utils.isOnInstance(this.idl, this.interface)) {
      targetObj = "obj";
    }

    const overloads = Overloads.getEffectiveOverloads(this.name, 0, this.interface, null);
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
          throw new TypeError("Failed to execute '${this.name}' on '${this.obj.name}': ${minConstructor.nameList.length} " +
                              "argument${plural} required, but only " + arguments.length + " present.");
        }
      `;
    }

    const callOn = this.static ? "Impl" : "this[impl]";
    // In case of stringifiers, use the named implementation function rather than hardcoded "toString".
    const implFunc = this.idl.name || this.name;

    const parameterConversions = Parameters.generateOverloadConversions(
      this.ctx, overloads, this.interface.name, `Failed to execute '${this.name}' on '${this.obj.name}': `);
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
