"use strict";

const conversions = require("webidl-conversions");
const Overloads = require("../overloads");
const Parameters = require("../parameters");

function Operation(obj, I, idl) {
  this.obj = obj;
  this.interface = I;
  this.idl = idl;
  this.name = idl.name;

  this.str = null;
}

Operation.prototype.generate = function () {
  const targetObj = this.idl.static ? "" : ".prototype";
  let name = this.idl.name;
  if (this.idl.stringifier && !name) {
    name = "toString";
  }

  if (this.idl.name === null) return "";
  const overloads = Overloads.getEffectiveOverloads(name, 0, this.interface, null);
  let minConstructor = overloads[0];

  for (let i = 1; i < overloads.length; ++i) {
    if (overloads[i].nameList.length < minConstructor.nameList.length) {
      minConstructor = overloads[i];
    }
  }

  this.str += "\n  " + (this.idl.static ? "static " : "") + `${name}(${minConstructor.nameList.join(", ")}) {`;
  if (minConstructor.nameList.length !== 0) {
    this.str += `
    if (arguments.length < ${minConstructor.nameList.length}) {
      throw new TypeError("Failed to execute '${name}' on '${this.obj.name}': ${minConstructor.nameList.length} argument required, but only " + arguments.length + " present.");
    }`;
  }

  this.str += Parameters.generateConversions(overloads);
  this.str += `
    return Impl.interface${targetObj}.${name}.apply(this, args);
  }\n`;
  if (this.idl.stringifier && name !== "toString") {
    this.str += `\n  toString(${minConstructor.nameList.join(", ")}) {`;
    this.str += Parameters.generateConversions(overloads);
    this.str += `
    return Impl.interface${targetObj}.${name}.apply(this, args);
  }\n`;
  }
};

Operation.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Operation;
