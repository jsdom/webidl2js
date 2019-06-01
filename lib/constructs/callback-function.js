"use strict";

const Types = require("../types");
const utils = require("../utils");

class CallbackFunction {
  constructor(ctx, idl) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;
    this.str = null;

    this.requires = new utils.RequiresMap(ctx);
  }

  generate() {
    // This is a simplification of https://heycam.github.io/webidl/#web-idl-arguments-list-converting that current fits
    // our needs.
    const argsToES = `
      for (let i = 0; i < args.length; i++) {
        args[i] = utils.tryWrapperForImpl(args[i]);
      }
      if (args.length < ${this.idl.arguments.length}) {
        for (let i = args.length; i < ${this.idl.arguments.length}; i++) {
          args[i] = undefined;
        }
      } else if (args.length > ${this.idl.arguments.length}) {
        args.length = ${this.idl.arguments.length};
      }
    `;

    let returnIDL;

    if (this.idl.idlType.idlType === "void") {
      returnIDL = "";
    } else {
      const conv = Types.generateTypeConversion(this.ctx, "returned", this.idl.idlType, [], this.name, "context");
      this.requires.merge(conv.requires);
      returnIDL = `
        ${conv.body}
        return returned;
      `;
    }

    const treatNonObjectAsNull = utils.getExtAttr(this.idl.extAttrs, "TreatNonObjectAsNull");
    const assertCallable = treatNonObjectAsNull ? "" : `
      if (typeof value !== "function" && !treatNonObjectAsNull) {
        throw new TypeError(context + " is not a function");
      }
    `;

    this.str += `
      module.exports = {
        convert(value, { context = "The provided value" } = {}) {
          ${assertCallable}

          function wrapper(...args) {
            if (new.target !== undefined) {
              throw new Error("Internal error: do not call converted callback function with \`new\`; instead use " +
                              "convertedFunc.construct()");
            }

            let returned;
    `;
    if (treatNonObjectAsNull) {
      this.str += `if (typeof value === "function") {`;
    }
    this.str += `
            ${argsToES}
            returned = Reflect.apply(value, this, args);
    `;
    if (treatNonObjectAsNull) {
      this.str += "}";
    }
    this.str += `
            ${returnIDL}
          }
          wrapper.construct = function(...args) {
            ${argsToES}
            let returned = Reflect.construct(value, args);
            ${returnIDL}
          };
          return wrapper;
        }
      };
    `;

    this.str = `
      ${this.requires.generate()}

      ${this.str}
    `;
  }

  toString() {
    this.str = "";
    this.generate();
    return this.str;
  }
}

module.exports = CallbackFunction;
