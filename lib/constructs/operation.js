"use strict";

const conversions = require("webidl-conversions");

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

  this.str += `${this.obj.name}${targetObj}.${name} = function (${argumentNames.join(", ")}) {`;

  for (let i = 0; i < this.idl.arguments.length; ++i) {
    const arg = this.idl.arguments[i];
    if (conversions[arg.idlType.idlType]) {
      this.str += `
  ${arg.name} = conversions["${arg.idlType.idlType}"](${arg.name});`;
    }
  }

  this.str += `
  Impl${targetObj}.${name}.call(this${argumentNames.length ? ", " + argumentNames.join(", ") : ""});
};\n\n`;
};

Operation.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Operation;
