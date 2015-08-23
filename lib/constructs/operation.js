"use strict";

const conversions = require("webidl-conversions");
const Parameters = require("../parameters");

function Operation(obj, idl) {
  this.obj = obj;
  this.idl = idl;
  this.name = idl.name;

  this.str = null;
}

Operation.prototype.generate = function () {
  const targetObj = this.idl.static ? "" : ".prototype";
  let name = this.idl.name;
  let args = this.idl.arguments;
  if (this.idl.stringifier && !name) {
    name = "toString";
    args = [];
  }
  const argumentNames = args.map(function(arg) { return arg.name; });

  this.str += "\n  " + (this.idl.static ? "static " : "") + `${name}(${argumentNames.join(", ")}) {`;

  const overloads = [{ operation: { arguments: args }, nameList: argumentNames }];
  this.str += Parameters.generateConversions(overloads);

  this.str += `
    Impl${targetObj}.${name}.call(this${argumentNames.length ? ", " + argumentNames.join(", ") : ""});
  }\n`;
};

Operation.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Operation;
