"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const Overloads = require("../overloads");
const Parameters = require("../parameters");
const keywords = require("../keywords");

function Operation(ctx, obj, I, idl) {
  this.ctx = ctx;
  this.obj = obj;
  this.interface = I;
  this.idl = idl;
  this.name = idl.name;
}

Operation.prototype.generate = function () {
  let requires = {};
  let str = "";

  if (this.idl.name === null) {
    return { requires: {}, body: "" };
  }

  let name = this.idl.name;
  if (this.idl.stringifier && !name) {
    name = "toString";
  }

  let targetObj = this.obj.name + (this.idl.static ? "" : ".prototype");
  if (utils.isOnInstance(this.idl, this.interface)) {
    targetObj = "obj";
  }

  const overloads = Overloads.getEffectiveOverloads(name, 0, this.interface, null);
  let minConstructor = overloads[0];

  for (let i = 1; i < overloads.length; ++i) {
    if (overloads[i].nameList.length < minConstructor.nameList.length) {
      minConstructor = overloads[i];
    }
  }

  const fnName = keywords.has(name) ? "_" : name;
  minConstructor.nameList = minConstructor.nameList.map((name) => (keywords.has(name) ? "_" : "") + name);

  str += `\n${targetObj}.${name} = function ${fnName}(${minConstructor.nameList.join(", ")}) {`;
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

  const parameterConversions = Parameters.generateOverloadConversions(this.ctx, overloads, this.interface.name, `Failed to execute '${name}' on '${this.obj.name}': `);
  const argsSpread = parameterConversions.hasArgs ? "...args" : "";
  Object.assign(requires, parameterConversions.requires);
  str += parameterConversions.body;
  if (!this.idl.stringifier && overloads.every((overload) => conversions[overload.operation.idlType.idlType])) {
    str += `
  return ${callOn}.${name}(${argsSpread});
};\n`;
  } else {
    str += `
  return utils.tryWrapperForImpl(${callOn}.${name}(${argsSpread}));
};\n`;
  }
  if (this.idl.stringifier && name !== "toString") {
    str += `\n${this.name}.prototype.toString(${minConstructor.nameList.join(", ")}) {`;
    str += parameterConversions.body;
    str += `
  return ${callOn}.${name}.apply(${argsSpread});
};\n`;
  }

  return {
    requires,
    body: str
  }
};

module.exports = Operation;
