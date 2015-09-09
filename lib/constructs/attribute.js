"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const reflector = require("../reflector");

function Attribute(obj, I, idl) {
  this.obj = obj;
  this.interface = I;
  this.idl = idl;

  this.str = null;
  this.needsElement = utils.hasExtAttr(this.idl.extAttrs, "Reflect");
}

Attribute.prototype.generate = function () {
  const targetObj = this.idl.static ? "" : ".prototype";
  const configurable = utils.hasExtAttr(this.idl.extAttrs, "Unforgeable") ? "false" : "true";
  const shouldReflect = utils.hasExtAttr(this.idl.extAttrs, "Reflect");

  var propSource = `Impl.interface`;
  if (this.idl.inherit) {
    propSource = `Object.getPrototypeOf(${this.interface.name})`;
  }

  let definedOn = this.obj.name + targetObj;
  if (configurable === "false") { // we're in the constructor and define an Unforgeable attribute
    definedOn = `this`;
  }

  let getterBody = `Object.getOwnProperyDescriptor(${propSource}${targetObj}, "${this.idl.name}").get.call(this);`;
  let setterBody = `Object.getOwnProperyDescriptor(Impl.interface${targetObj}, "${this.idl.name}").set.call(this, V);`;
  if (shouldReflect) {
    if (!reflector[this.idl.idlType.idlType]) {
      throw new Error("Unknown reflector type: " + this.idl.idlType.idlType);
    }
    getterBody = reflector[this.idl.idlType.idlType].get(this.idl.name);
    setterBody = reflector[this.idl.idlType.idlType].set(this.idl.name);
  }

  this.str += `Object.defineProperty(${definedOn}, "${this.idl.name}", {
  get: function () {
    ${getterBody}
  },`;
  if (!this.idl.readonly) {
    let conversion = ``;
    if (conversions[this.idl.idlType.idlType]) {
      conversion = `
    V = conversions["${this.idl.idlType.idlType}"](V);`;
    }
    this.str += `
  set: function (V) {${conversion}
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
}\n\n`;
  }
};

Attribute.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Attribute;
