"use strict";

const conversions = require("webidl-conversions");
const Overloads = require("../overloads");
const Parameters = require("../parameters");
const keywords = require("../keywords");

function Operation(obj, I, idl) {
  this.obj = obj;
  this.interface = I;
  this.idl = idl;
  this.name = idl.name;
}

Operation.prototype.generate = function () {
  let requires = {};
  let str = "";
  const targetObj = this.idl.static ? "" : ".prototype";
  let name = this.idl.name;
  if (this.idl.stringifier && !name) {
    name = "toString";
  }

  if (this.idl.name === null) return { requires: {}, body: "" };
  const overloads = Overloads.getEffectiveOverloads(name, 0, this.interface, null);
  let minConstructor = overloads[0];

  for (let i = 1; i < overloads.length; ++i) {
    if (overloads[i].nameList.length < minConstructor.nameList.length) {
      minConstructor = overloads[i];
    }
  }

  const fnName = keywords.has(name) ? "_" : name;
  minConstructor.nameList = minConstructor.nameList.map((name) => (keywords.has(name) ? "_" : "") + name);

  str += `\n${this.obj.name + targetObj}.${name} = function ${fnName}(${minConstructor.nameList.join(", ")}) {`;
  if (!this.idl.static) {
    str += `
  if (!this || !module.exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }`;
  }

  if (minConstructor.nameList.length !== 0) {
    const plural = minConstructor.nameList.length > 1 ? "s" : "";
    str += `
  if (arguments.length < ${minConstructor.nameList.length}) {
    throw new TypeError("Failed to execute '${name}' on '${this.obj.name}': ${minConstructor.nameList.length} argument${plural} required, but only " + arguments.length + " present.");
  }`;
  }

  const callOn = this.idl.static ? "Impl" : "this[impl]";

  const parameterConversions = Parameters.generateOverloadConversions(overloads, this.obj.opts.customTypes);
  Object.assign(requires, parameterConversions.requires);
  str += parameterConversions.body;
  str += `
  return utils.tryWrapperForImpl(${callOn}.${name}.apply(${callOn}, args));
};\n`;
  if (this.idl.stringifier && name !== "toString") {
    str += `\n${this.name}.prototype.toString(${minConstructor.nameList.join(", ")}) {`;
    str += parameterConversions.body;
    str += `
  return ${callOn}.${name}.apply(${callOn}, args);
};\n`;
  }

  return {
    requires,
    body: str
  }
};

module.exports = Operation;
