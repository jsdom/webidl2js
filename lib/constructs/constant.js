"use strict";

function Constant(obj, I, idl) {
  this.obj = obj;
  this.interface = I;
  this.idl = idl;

  this.str = null;
}

Constant.prototype.generate = function () {
  this.str += `Object.defineProperty(${this.obj.name}, "${this.idl.name}", {
  value: ${JSON.stringify(this.idl.value.value)},
  enumerable: true
});
Object.defineProperty(${this.obj.name}.prototype, "${this.idl.name}", {
  value: ${JSON.stringify(this.idl.value.value)},
  enumerable: true
});\n\n`;
};

Constant.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Constant;
