"use strict";

const Attribute = require("./attribute");
const Operation = require("./operation");

function Interface(idl) {
  this.idl = idl;
  this.name = idl.name;

  this.mixins = [];
  this.str = null;
}

Interface.prototype.type = "interface";

Interface.prototype.implements = function (source) {
  this.mixins.push(source);
};

Interface.prototype.generateConstructor = function () {
  const constructors = this.idl.extAttrs
    .filter(function(attr) { return attr.name === "Constructor"; })
    .map(function(attr) { return attr.arguments; });

  if (constructors.length === 0) {
    this.str += `function ${this.name}() {
  throw new TypeError("Illegal constructor");
}\n`;
  } else {
    this.str += `function ${this.name}() {}\n`;
  }
};

Interface.prototype.generateMixinPrefix = function () {
  if (this.mixins.length !== 0) {
    this.str += `const mixin = require("./utils.js").mixin;\n`;
    for (let i = 0; i < this.mixins.length; ++i) {
      this.str += `const ${this.mixins[i]} = require("./${this.mixins[i]}.js");\n`;
    }
    this.str += `\n`;
  }
};

Interface.prototype.generateMixinSuffix = function () {
  for (let i = 0; i < this.mixins.length; ++i) {
    this.str += `mixin(${this.name}.prototype, ${this.mixins[i]});\n`;
  }
};

Interface.prototype.generateExport = function () {
  var shouldExpose = this.idl.extAttrs
    .filter(function(attr) { return attr.name === "NoInterfaceObject"; })
    .length === 0 ? "true" : "false";
  this.str += `module.exports = {
  expose: ${shouldExpose},
  object: ${this.name}
};\n\n`;
};

Interface.prototype.generateMembers = function () {
  for (let i = 0; i < this.idl.members.length; ++i) {
    const memberIdl = this.idl.members[i];
    let member = null;

    switch (memberIdl.type) {
      case "attribute":
        member = new Attribute(this, memberIdl);
        break;
      case "operation":
        member = new Operation(this, memberIdl);
        break;
      default:
        //throw new Error("Can't handle member of type '" + memberIdl.type + "'");
        break;
    }

    if (member !== null) {
      this.str += member.toString();
    }
  }
};

Interface.prototype.generate = function () {
  this.generateMixinPrefix();
  this.generateConstructor();

  this.generateExport();
  this.str += `${this.name}.name = "${this.name}";\n\n`;

  this.generateMembers();

  this.generateMixinSuffix();
};

Interface.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Interface;
