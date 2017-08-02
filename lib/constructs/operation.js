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
  }

  generate() {
    const requires = new utils.RequiresMap(this.ctx);
    let str = "";

    let name = this.idl.name;
    if (!name) {
      if (this.idl.stringifier) {
        name = "toString";
      } else {
        return { requires, body: "" };
      }
    }

    let targetObj = this.obj.name + (this.idl.static ? "" : ".prototype");
    if (utils.isOnInstance(this.idl, this.interface)) {
      targetObj = "obj";
    }

    const overloads = Overloads.getEffectiveOverloads(name, 0, this.interface, null);
    let minConstructor = overloads[0];

    for (let i = 1; i < overloads.length; ++i) {
      if (overloads[i].nameList.length < minConstructor.nameList.length) {
        minConstructor = overloads[i];
      }
    }

    const fnName = keywords.has(name) ? "_" : name;
    minConstructor.nameList = minConstructor.nameList.map(n => (keywords.has(n) ? "_" : "") + n);

    str += `
      ${targetObj}.${name} = function ${fnName}(${minConstructor.nameList.join(", ")}) {
    `;
    if (!this.idl.static) {
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
          throw new TypeError("Failed to execute '${name}' on '${this.obj.name}': ${minConstructor.nameList.length} " +
                              "argument${plural} required, but only " + arguments.length + " present.");
        }
      `;
    }

    const callOn = this.idl.static ? "Impl" : "this[impl]";

    const parameterConversions = Parameters.generateOverloadConversions(
      this.ctx, overloads, this.interface.name, `Failed to execute '${name}' on '${this.obj.name}': `);
    const argsSpread = parameterConversions.hasArgs ? "...args" : "";
    requires.merge(parameterConversions.requires);
    str += parameterConversions.body;

    if (this.idl.stringifier || overloads.every(overload => conversions[overload.operation.idlType.idlType])) {
      str += `
          return ${callOn}.${name}(${argsSpread});
        };
      `;
    } else {
      str += `
          return utils.tryWrapperForImpl(${callOn}.${name}(${argsSpread}));
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
