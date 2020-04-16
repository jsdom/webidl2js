"use strict";

const utils = require("../utils.js");
const Types = require("../types.js");

class CallbackFunction {
  /**
   * @param {import("../context.js")} ctx
   * @param {import("webidl2").CallbackType} idl
   */
  constructor(ctx, idl) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;
    this.str = null;

    this.requires = new utils.RequiresMap(ctx);
  }

  generateConversion() {
    const { idl } = this;
    const isAsync = idl.idlType.generic === "Promise";

    const treatNonObjectAsNull = Boolean(utils.getExtAttr(idl.extAttrs, "TreatNonObjectAsNull"));
    const assertCallable = treatNonObjectAsNull ? "" : `
      if (typeof value !== "function") {
        throw new TypeError(context + " is not a function");
      }
    `;

    let returnIDL = "";
    if (idl.idlType.idlType !== "void") {
      const conv = Types.generateTypeConversion(this.ctx, "callResult", idl.idlType, [], this.name, "context");
      this.requires.merge(conv.requires);
      returnIDL = `
        ${conv.body}
        return callResult;
      `;
    }

    // This is a simplification of https://heycam.github.io/webidl/#web-idl-arguments-list-converting that currently
    // fits our needs.
    const maxArgs = idl.arguments.some(arg => arg.variadic) ? Infinity : idl.arguments.length;
    let minArgs = 0;
    for (const arg of idl.arguments) {
      if (arg.optional || arg.variadic) {
        break;
      }

      minArgs++;
    }

    let argsToES = "";
    if (maxArgs > 0) {
      argsToES += `
        for (let i = 0; i < ${Number.isFinite(maxArgs) ? `Math.min(args.length, ${maxArgs})` : "args.length"}; i++) {
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

    this.str += `
      exports.convert = (value, { context = "The provided value" } = {}) => {
        ${assertCallable}
        function invokeTheCallbackFunction(${maxArgs > 0 ? "...args" : ""}) {
          const thisArg = utils.tryWrapperForImpl(this);
          let callResult;
    `;

    if (isAsync) {
      this.str += `
          try {
      `;
    }

    if (treatNonObjectAsNull) {
      this.str += `
            if (typeof value === "function") {
      `;
    }

    this.str += `
            ${argsToES}
            callResult = Reflect.apply(value, thisArg, ${maxArgs > 0 ? "args" : "[]"});
    `;

    if (treatNonObjectAsNull) {
      this.str += "}";
    }

    this.str += `
            ${returnIDL}
    `;

    if (isAsync) {
      this.str += `
          } catch (err) {
            return Promise.reject(err);
          }
      `;
    }

    this.str += `
        };
    `;

    // `[TreatNonObjctAsNull]` and `isAsync` don't apply to
    // https://heycam.github.io/webidl/#construct-a-callback-function.
    this.str += `
    invokeTheCallbackFunction.construct = (${maxArgs > 0 ? "...args" : ""}) => {
          ${argsToES}
          let callResult = Reflect.construct(value, ${maxArgs > 0 ? "args" : "[]"});
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
