"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const Overloads = require("../overloads");
const Parameters = require("../parameters");

class Operation {
  constructor(ctx, I, idl) {
    this.ctx = ctx;
    this.interface = I;
    this.idls = [idl];
    this.name = idl.name;
    this.static = idl.special === "static";
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

  fixUpArgsExtAttrs() {
    for (const idl of this.idls) {
      for (const arg of idl.arguments) {
        if (arg.extAttrs.length) {
          // Overwrite rather than push to workaround old webidl2 array-sharing bug
          // It's safe as the two cannot coexist.
          arg.idlType.extAttrs = [...arg.extAttrs];
        }
      }
    }
  }

  generate() {
    const requires = new utils.RequiresMap(this.ctx);

    this.fixUpArgsExtAttrs();
    let str = "";

    if (!this.name) {
      throw new Error(`Internal error: this operation does not have a name (in interface ${this.interface.name})`);
    }

    const onInstance = this.isOnInstance();

    const type = this.static ? "static operation" : "regular operation";
    const overloads = Overloads.getEffectiveOverloads(type, this.name, 0, this.interface);
    let minOp = overloads[0];
    for (let i = 1; i < overloads.length; ++i) {
      if (overloads[i].nameList.length < minOp.nameList.length) {
        minOp = overloads[i];
      }
    }

    const argNames = minOp.nameList;

    if (!this.static) {
      str += `
        const esValue = this !== null && this !== undefined ? this : globalObject;
        if (!exports.is(esValue)) {
          throw new TypeError("Illegal invocation");
        }
      `;
    }

    const callOn = this.static ? "Impl.implementation" : `esValue[implSymbol]`;
    // In case of stringifiers, use the named implementation function rather than hardcoded "toString".
    // All overloads will have the same name, so pick the first one.
    const implFunc = this.idls[0].name || this.name;

    const parameterConversions = Parameters.generateOverloadConversions(
      this.ctx, type, this.name, this.interface, `Failed to execute '${this.name}' on '${this.interface.name}': `);
    const argsSpread = parameterConversions.hasArgs ? "...args" : "";
    requires.merge(parameterConversions.requires);
    str += parameterConversions.body;

    let invocation;
    if (overloads.every(overload => conversions[overload.operation.idlType.idlType])) {
      invocation = `
        return ${callOn}.${implFunc}(${argsSpread});
      `;
    } else {
      invocation = `
        return utils.tryWrapperForImpl(${callOn}.${implFunc}(${argsSpread}));
      `;
    }

    if (utils.hasCEReactions(this.idls[0])) {
      invocation = this.ctx.invokeProcessCEReactions(invocation, {
        requires
      });
    }
    str += invocation;

    if (this.static) {
      this.interface.addStaticMethod(this.name, argNames, str);
    } else {
      const forgeable = !utils.getExtAttr(this.idls[0].extAttrs, "Unforgeable");
      this.interface.addMethod(
        onInstance ? "instance" : "prototype",
        this.name,
        argNames,
        str,
        "regular",
        { configurable: forgeable, writable: forgeable }
      );
    }

    return { requires };
  }
}

module.exports = Operation;
