"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const reflector = require("../reflector");
const Parameters = require("../parameters");

function Attribute(obj, I, idl) {
  this.obj = obj;
  this.interface = I;
  this.idl = idl;
}

Attribute.prototype.generate = function () {
  let str = "";
  let requires = {};

  const configurable = utils.getExtAttr(this.idl.extAttrs, "Unforgeable") ? "false" : "true";
  const shouldReflect = utils.getExtAttr(this.idl.extAttrs, "Reflect");

  let objName = `this`;
  let definedOn = this.obj.name + (this.idl.static ? "" : ".prototype");
  if (configurable === "false") { // we're in a setup method and define an Unforgeable attribute
    objName = `obj`;
    definedOn = `obj`;
  }

  let getterBody = `return ${objName}[impl].${this.idl.name};`;
  let setterBody = `${objName}[impl].${this.idl.name} = V;`;
  if (this.idl.static) {
    getterBody = `return Impl.${this.idl.name};`;
    setterBody = `Impl.${this.idl.name} = V;`;
  } else if (shouldReflect) {
    if (!reflector[this.idl.idlType.idlType]) {
      throw new Error("Unknown reflector type: " + this.idl.idlType.idlType);
    }
    getterBody = reflector[this.idl.idlType.idlType].get(objName, this.idl.name);
    setterBody = reflector[this.idl.idlType.idlType].set(objName, this.idl.name);
  }

  str += `Object.defineProperty(${definedOn}, "${this.idl.name}", {
  get() {
    ${getterBody}
  },`;
  if (!this.idl.readonly) {
    const conv = Parameters.generateVarConversion("V", { type: this.idl.idlType, optional: false }, this.idl.extAttrs, new Set());
    Object.assign(requires, conv.requires);
    let conversion = conv.body.replace(/\n/g, "\n  ");
    str += `
  set(V) {${conversion}
    ${setterBody}
  },`;
  }
  str += `
  enumerable: true,
  configurable: ${configurable}
});\n\n`;

  if (this.idl.stringifier) {
    str += `${this.obj.name}.prototype.toString = function () {
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }
  return this.${this.idl.name};
};\n\n`;
  }

  return {
    requires,
    body: str
  };
};

module.exports = Attribute;
