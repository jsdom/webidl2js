"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");

function Attribute(obj, I, idl) {
  this.obj = obj;
  this.interface = I;
  this.idl = idl;

  this.str = null;
  //console.log(idl)
}

Attribute.prototype.generate = function () {
  const targetObj = this.idl.static ? "" : ".prototype";
  const configurable = utils.hasExtAttr(this.idl.extAttrs, "Unforgeable") ? "false" : "true";

  var propSource = `Impl.interface`;
  if (this.idl.inherit) {
    propSource = `Object.getPrototypeOf(${this.interface.name})`;
  }

  let definedOn = this.obj.name + targetObj;
  if (configurable === "false") { // we're in the constructor and define an Unforgeable attribute
    definedOn = `this`;
  }

  this.str += `Object.defineProperty(${definedOn}, "${this.idl.name}", {
  get: function () {
    ${propSource}${targetObj}.getOwnProperyDescriptor("${this.idl.name}").get.call(this);
  },`;
  if (!this.idl.readonly) {
    let conversion = ``;
    if (conversions[this.idl.idlType.idlType]) {
      conversion = `
    V = conversions["${this.idl.idlType.idlType}"](V);`;
    }
    this.str += `
  set: function (V) {${conversion}
    Impl.interface${targetObj}.getOwnProperyDescriptor("${this.idl.name}").set.call(this, V);
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
