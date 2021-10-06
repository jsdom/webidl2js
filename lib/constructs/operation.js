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

  getWhence() {
    const { idls } = this;
    const firstOverloadOnInstance = utils.isOnInstance(idls[0], this.interface.idl);
    const hasLegacyUnforgeable = Boolean(utils.getExtAttr(idls[0].extAttrs, "LegacyUnforgeable"));

    for (let i = 1; i < idls.length; i++) {
      if (Boolean(utils.getExtAttr(idls[i].extAttrs, "LegacyUnforgeable")) !== hasLegacyUnforgeable) {
        throw new Error(
          `[LegacyUnforgeable] is not applied uniformly to operation "${this.name}" on ${this.interface.name}`
        );
      }
    }

    if (hasLegacyUnforgeable) {
      return "unforgeables";
    }

    return firstOverloadOnInstance ? "instance" : "prototype";
  }

  isAsync() {
    // As of the time of this writing, the current spec does not disallow such overloads, but the intention is to do so:
    // https://github.com/heycam/webidl/pull/776
    const firstAsync = this.idls[0].idlType.generic === "Promise";
    for (const overload of this.idls.slice(1)) {
      const isAsync = overload.idlType.generic === "Promise";
      if (isAsync !== firstAsync) {
        throw new Error(
          `Overloading between Promise and non-Promise return types is not allowed: operation ` +
          `"${this.name}" on ${this.interface.name}`
        );
      }
    }
    return firstAsync;
  }

  hasCallWithGlobal() {
    const { idls } = this;
    const hasCallWithGlobal = Boolean(utils.getExtAttr(idls[0].extAttrs, "WebIDL2JSCallWithGlobal"));

    if (hasCallWithGlobal && !this.static) {
      throw new Error(
        `[WebIDL2JSCallWithGlobal] is only valid for static operations: "${this.name}" on ${this.interface.name}`
      );
    }

    for (let i = 1; i < idls.length; i++) {
      if (hasCallWithGlobal !== Boolean(utils.getExtAttr(idls[i].extAttrs, "WebIDL2JSCallWithGlobal"))) {
        throw new Error(
          `[WebIDL2JSCallWithGlobal] is not applied uniformly to operation "${this.name}" on ${this.interface.name}`
        );
      }
    }

    return hasCallWithGlobal;
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

    const whence = this.getWhence();
    const async = this.isAsync();
    const promiseHandlingBefore = async ? `try {` : ``;
    const promiseHandlingAfter = async ? `} catch (e) { return globalObject.Promise.reject(e); }` : ``;
    const hasCallWithGlobal = this.hasCallWithGlobal();

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
          throw new globalObject.TypeError("'${this.name}' called on an object that is not a valid instance of ${this.interface.name}.");
        }
      `;
    }

    const callOn = this.static ? "Impl.implementation" : `esValue[implSymbol]`;
    // In case of stringifiers, use the named implementation function rather than hardcoded "toString".
    // All overloads will have the same name, so pick the first one.
    const implFunc = this.idls[0].name || this.name;

    const parameterConversions = Parameters.generateOverloadConversions(
      this.ctx,
      type,
      this.name,
      this.interface,
      `Failed to execute '${this.name}' on '${this.interface.name}': `
    );
    const args = [];
    requires.merge(parameterConversions.requires);
    str += parameterConversions.body;

    if (hasCallWithGlobal) {
      args.push("globalObject");
    }

    if (parameterConversions.hasArgs) {
      args.push("...args");
    }

    let invocation;
    if (overloads.every(overload => conversions[overload.operation.idlType.idlType])) {
      invocation = `
        return ${callOn}.${implFunc}(${utils.formatArgs(args)});
      `;
    } else {
      invocation = `
        return utils.tryWrapperForImpl(${callOn}.${implFunc}(${utils.formatArgs(args)}));
      `;
    }

    if (utils.hasCEReactions(this.idls[0])) {
      invocation = this.ctx.invokeProcessCEReactions(invocation, {
        requires
      });
    }
    str += invocation;

    str = promiseHandlingBefore + str + promiseHandlingAfter;

    if (this.static) {
      this.interface.addStaticMethod(this.name, argNames, str);
    } else {
      const forgeable = whence !== "unforgeables";
      this.interface.addMethod(
        whence,
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
