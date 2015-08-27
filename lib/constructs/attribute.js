"use strict";

const conversions = require("webidl-conversions");

function Attribute(obj, idl) {
  this.obj = obj;
  this.idl = idl;

  this.str = null;
  //console.log(idl)
}

Attribute.prototype.generate = function () {
  const targetObj = this.idl.static ? "" : ".prototype";
  const configurable = this.idl.extAttrs
    .filter(function(attr) { return attr.name === "Unforgeable"; })
    .length === 0 ? "true" : "false";

  this.str += `Object.defineProperty(${this.obj.name}${targetObj}, "${this.idl.name}", {
  get: function () {
    Impl.interface${targetObj}.getOwnProperyDescriptor("${this.idl.name}").get.call(this);
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
