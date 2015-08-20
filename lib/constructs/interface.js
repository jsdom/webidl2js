"use strict";

const Attribute = require("./attribute");
const Operation = require("./operation");
const Overloads = require("../overloads");

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
  const overloads = Overloads.getEffectiveOverloads("constructor", 0, this.idl, null);

  this.str += `class ${this.name} `;
  if (this.idl.inheritance !== null) {
    this.str += `extends ${this.idl.inheritance} `;
  }
  this.str += `{`;

  if (overloads.length !== 0) {
    let minConstructor = overloads[0];
    for (let i = 1; i < overloads.length; ++i) {
      if (overloads[i].nameList.length < minConstructor.nameList.length) {
        minConstructor = overloads[i];
      }
    }

    this.str += `
  constructor (${minConstructor.nameList.join(", ")}) {`;
    if (this.idl.inheritance !== null) {
      this.str += `
    super(...arguments);`;
    }
    this.str += `
    const args = [];
    for (let i = 0; i < arguments.length; ++i) {
      args[i] = arguments[i];
    }
    Impl.apply(this, args);
  }\n`;
  }
};

Interface.prototype.generateRequires = function () {
  if (this.idl.inheritance !== null) {
    this.str += `const ${this.idl.inheritance} = require("./${this.idl.inheritance}.js").interface;\n`;
  }

  if (this.mixins.length !== 0) {
    this.str += `const mixin = require("./utils.js").mixin;\n`;
    for (let i = 0; i < this.mixins.length; ++i) {
      this.str += `const ${this.mixins[i]} = require("./${this.mixins[i]}.js").interface;\n`;
    }
    this.str += `\n`;
  }
};

Interface.prototype.generateMixins = function () {
  for (let i = 0; i < this.mixins.length; ++i) {
    this.str += `mixin(${this.name}.prototype, ${this.mixins[i]}.prototype);\n`;
  }
};

Interface.prototype.generateExport = function () {
  var exposeObjects = "";
  var shouldExposeRoot = this.idl.extAttrs
    .filter(function(attr) { return attr.name === "NoInterfaceObject"; })
    .length === 0 ? "true" : "false";

  if (shouldExposeRoot) {
    exposeObjects += ", " + this.idl.name + ": " + this.idl.name;
  }

  this.str += `\nmodule.exports = {
  interface: ${this.name},
  objects: {${exposeObjects.substring(2)}}
};\n\n`;
};

Interface.prototype.generateOperations = function () {
  for (let i = 0; i < this.idl.members.length; ++i) {
    const memberIdl = this.idl.members[i];
    let member = null;

    switch (memberIdl.type) {
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

Interface.prototype.generateAttributes = function () {
  for (let i = 0; i < this.idl.members.length; ++i) {
    const memberIdl = this.idl.members[i];
    let member = null;

    switch (memberIdl.type) {
      case "attribute":
        member = new Attribute(this, memberIdl);
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
  this.generateRequires();

  this.generateConstructor();

  this.generateOperations();

  this.str += `}\n\n`;

  this.generateAttributes();

  this.generateMixins();
  this.generateExport();
};

Interface.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Interface;
