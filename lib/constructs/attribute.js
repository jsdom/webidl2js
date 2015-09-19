"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const reflector = require("../reflector");

function Attribute(obj, I, idl) {
  this.obj = obj;
  this.interface = I;
  this.idl = idl;

  this.str = null;
}

Attribute.prototype.generate = function () {
  const configurable = utils.hasExtAttr(this.idl.extAttrs, "Unforgeable") ? "false" : "true";
  const shouldReflect = utils.hasExtAttr(this.idl.extAttrs, "Reflect");

  let definedOn = this.obj.name + (this.idl.static ? "" : ".prototype");
  if (configurable === "false") { // we're in the constructor and define an Unforgeable attribute
    definedOn = `this`;
  }

  let getterBody = `return this[impl].${this.idl.name}`;
  let setterBody = `this[impl].${this.idl.name} = V;`;
  if (this.idl.static) {
    getterBody = `return Impl.${this.idl.name}`;
    setterBody = `Impl.${this.idl.name} = V;`;
  } else if (shouldReflect) {
    if (!reflector[this.idl.idlType.idlType]) {
      throw new Error("Unknown reflector type: " + this.idl.idlType.idlType);
    }
    getterBody = reflector[this.idl.idlType.idlType].get(this.idl.name);
    setterBody = reflector[this.idl.idlType.idlType].set(this.idl.name);
  }

  this.str += `Object.defineProperty(${definedOn}, "${this.idl.name}", {
  get() {
    ${getterBody}
  },`;
  if (!this.idl.readonly) {
    let conversion = ``;
    if (conversions[this.idl.idlType.idlType]) {
      conversion = `
    V = conversions["${this.idl.idlType.idlType}"](V);`;
    }
    this.str += `
  set(V) {${conversion}
    ${setterBody}
  },`;
  }
  this.str += `
  enumerable: true,
  configurable: ${configurable}
});\n\n`;

  if (this.idl.stringifier) {
    this.str += `${this.obj.name}.prototype.toString = function () {
  return this.${this.idl.name};
};\n\n`;
  }
};

Attribute.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Attribute;
