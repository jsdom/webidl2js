"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils.js");
const Types = require("../types.js");

class CallbackFunction {
  constructor(ctx, idl) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;
    this.str = null;

    this.requires = new utils.RequiresMap(ctx);

    this.legacyTreatNonObjectAsNull = Boolean(utils.getExtAttr(idl.extAttrs, "LegacyTreatNonObjectAsNull"));
  }

  generateConversion() {
    const { idl, legacyTreatNonObjectAsNull } = this;
    const isAsync = idl.idlType.generic === "Promise";

    const assertCallable = legacyTreatNonObjectAsNull ?
      "" :
      `
        if (typeof value !== "function") {
          throw new globalObject.TypeError(context + " is not a function");
        }
      `;

    let returnIDL = "";
    if (idl.idlType.idlType !== "undefined") {
      const conv = Types.generateTypeConversion(this.ctx, "callResult", idl.idlType, [], this.name, "context");
      this.requires.merge(conv.requires);
      returnIDL = `
        ${conv.body}
        return callResult;
      `;
    }

    // This is a simplification of https://heycam.github.io/webidl/#web-idl-arguments-list-converting that currently
    // fits our needs.
    let argsToES = "";
    let inputArgs = "";
    let applyArgs = "[]";

    if (idl.arguments.length > 0) {
      if (idl.arguments.every(arg => !arg.optional && !arg.variadic)) {
        const argNames = idl.arguments.map(arg => arg.name);
        inputArgs = argNames.join(", ");
        applyArgs = `[${inputArgs}]`;

        for (const arg of idl.arguments) {
          const argName = arg.name;
          if (arg.idlType.union ?
            arg.idlType.idlType.some(type => !conversions[type.idlType]) :
            !conversions[arg.idlType.idlType]) {
            argsToES += `
              ${argName} = utils.tryWrapperForImpl(${argName});
            `;
          }
        }
      } else {
        const maxArgs = idl.arguments.some(arg => arg.variadic) ? Infinity : idl.arguments.length;
        let minArgs = 0;

        for (const arg of idl.arguments) {
          if (arg.optional || arg.variadic) {
            break;
          }

          minArgs++;
        }

        if (maxArgs > 0) {
          inputArgs = "...args";
          applyArgs = "args";

          const maxArgsLoop = Number.isFinite(maxArgs) ?
            `Math.min(args.length, ${maxArgs})` :
            "args.length";

          argsToES += `
            for (let i = 0; i < ${maxArgsLoop}; i++) {
              args[i] = utils.tryWrapperForImpl(args[i]);
            }
          `;

          if (minArgs > 0) {
            argsToES += `
              if (args.length < ${minArgs}) {
                for (let i = args.length; i < ${minArgs}; i++) {
                  args[i] = undefined;
                }
              }
            `;
          }

          if (Number.isFinite(maxArgs)) {
            argsToES += `
              ${minArgs > 0 ? "else" : ""} if (args.length > ${maxArgs}) {
                args.length = ${maxArgs};
              }
            `;
          }
        }
      }
    }

    this.str += `
      exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
        ${assertCallable}
        function invokeTheCallbackFunction(${inputArgs}) {
          const thisArg = utils.tryWrapperForImpl(this);
          let callResult;
    `;

    if (isAsync) {
      this.str += `
          try {
      `;
    }

    if (legacyTreatNonObjectAsNull) {
      this.str += `
            if (typeof value === "function") {
      `;
    }

    this.str += `
            ${argsToES}
            callResult = Reflect.apply(value, thisArg, ${applyArgs});
    `;

    if (legacyTreatNonObjectAsNull) {
      this.str += "}";
    }

    this.str += `
            ${returnIDL}
    `;

    if (isAsync) {
      this.str += `
          } catch (err) {
            return globalObject.Promise.reject(err);
          }
      `;
    }

    this.str += `
        };
    `;

    // `[TreatNonObjctAsNull]` and `isAsync` don't apply to
    // https://heycam.github.io/webidl/#construct-a-callback-function.
    this.str += `
        invokeTheCallbackFunction.construct = (${inputArgs}) => {
          ${argsToES}
          let callResult = Reflect.construct(value, ${applyArgs});
          ${returnIDL}
        };
    `;

    // The wrapperSymbol ensures that if the callback function is used as a return value, that it exposes
    // the original callback back. I.e. it implements the conversion from IDL to JS value in
    // https://heycam.github.io/webidl/#es-callback-function.
    //
    // The objectReference is used to implement spec text such as that discussed in
    // https://github.com/whatwg/dom/issues/842.
    this.str += `
        invokeTheCallbackFunction[utils.wrapperSymbol] = value;
        invokeTheCallbackFunction.objectReference = value;

        return invokeTheCallbackFunction;
      };
    `;
  }

  generateRequires() {
    this.str = `
      ${this.requires.generate()}

      ${this.str}
    `;
  }

  generate() {
    this.generateConversion();

    this.generateRequires();
  }

  toString() {
    this.str = "";
    this.generate();
    return this.str;
  }
}

CallbackFunction.prototype.type = "callback";

module.exports = CallbackFunction;
