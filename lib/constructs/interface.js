"use strict";

const path = require("path");

const utils = require("../utils");
const Attribute = require("./attribute");
const Operation = require("./operation");
const Overloads = require("../overloads");
const Parameters = require("../parameters");

function Interface(idl, implDir) {
  this.idl = idl;
  this.name = idl.name;

  this.mixins = [];
  this.str = null;
  this.implDir = implDir;
}

Interface.prototype.type = "interface";

Interface.prototype.implements = function (source) {
  this.mixins.push(source);
};

Interface.prototype.generateConstructor = function () {
  const overloads = Overloads.getEffectiveOverloads("constructor", 0, this.idl, null);

  this.str += `class ${this.name} `;
  if (this.idl.inheritance) {
    this.str += `extends ${this.idl.inheritance}.interface `;
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
  constructor(${minConstructor.nameList.join(", ")}) {`;
    if (minConstructor.nameList.length !== 0) {
      this.str += `
    if (arguments.length < ${minConstructor.nameList.length}) {
      throw new TypeError("Failed to construct '${this.name}': ${minConstructor.nameList.length} argument required, but only " + arguments.length + " present.");
    }`;
    }
    this.str += Parameters.generateConversions(overloads) + "\n";


    for (let i = 0; i < this.idl.members.length; ++i) {
      const memberIdl = this.idl.members[i];
      if (memberIdl.type === "attribute" && utils.hasExtAttr(memberIdl.extAttrs, "Unforgeable")) {
          const member = new Attribute(this, this.idl, memberIdl);
          this.str += "\n    " + member.toString().replace(/\n/g, '\n    ');
      }
    }

    this.str += `module.exports.init.apply(this, args);
  }\n`;
  }
};

Interface.prototype.generateRequires = function () {
  if (this.idl.inheritance !== null) {
    this.str += `const ${this.idl.inheritance} = require("./${this.idl.inheritance}.js");\n`;
  }

  if (this.mixins.length !== 0) {
    this.str += `const mixin = require("./utils.js").mixin;\n`;
    for (let i = 0; i < this.mixins.length; ++i) {
      this.str += `const ${this.mixins[i]} = require("./${this.mixins[i]}.js").interface;\n`;
    }
  }

  if (this.idl.inheritance !== "Element" && this.mixins.indexOf("Element") === -1) {
    let needsElement = false;
    for (let i = 0; i < this.idl.members.length; ++i) {
      const memberIdl = this.idl.members[i];
      if (memberIdl.type === "attribute" && utils.hasExtAttr(memberIdl.extAttrs, "Reflect")) {
        needsElement = true;
        break;
      }
    }
    if (needsElement) {
      this.str += `const Element = require("./Element.js").interface;\n`;
    }
  }
  this.str += `\n`;
};

Interface.prototype.generateMixins = function () {
  for (let i = 0; i < this.mixins.length; ++i) {
    this.str += `mixin(${this.name}.prototype, ${this.mixins[i]}.prototype);\n`;
  }
};

Interface.prototype.generateExport = function () {
  const shouldExposeRoot = !utils.hasExtAttr(this.idl.extAttrs, "NoInterfaceObject");

  const exposedMap = {};
  if (shouldExposeRoot) {
    let exposedOn = ["Window"];
    const exposedAttrs = this.idl.extAttrs
      .filter(function (attr) { return attr.name === "Exposed"; });
    if (exposedAttrs.length !== 0) {
      if (typeof exposedAttrs[0].rhs.value === "string") {
        exposedAttrs[0].rhs.value = [exposedAttrs[0].rhs.value];
      }
      exposedOn = exposedAttrs[0].rhs.value;
    }
    for (let i = 0; i < exposedOn.length; ++i) {
      if (!exposedMap[exposedOn[i]]) {
        exposedMap[exposedOn[i]] = [];
      }
      exposedMap[exposedOn[i]].push(this.name);
    }
  }

  let exposers = [];
  for (let keys = Object.keys(exposedMap), i = 0; i < keys.length; ++i) {
    let exposedOnObj = exposedMap[keys[i]].map(function (o) { return o + ": " + o; });
    exposers.push(keys[i] + ": { " + exposedOnObj.join(", ") + " }");
  }

  let superClass = null;
  try {
    superClass = require(this.implDir + "/" + this.idl.inheritance);
  } catch (e) {}
  let implClass = null;
  try {
    implClass = require(this.implDir + "/" + this.name);
  } catch (e) {}

  this.str += `\nmodule.exports = {
  init() {
    let obj = this;
    if (!obj) {
      obj = Object.create(${this.name}.prototype);
    }`;
  if (this.idl.inheritance !== null && superClass && superClass.init) {
    this.str += `
    ${this.idl.inheritance}.init.apply(obj, arguments);`;
  }
  if (implClass && implClass.init) {
    this.str += `
    Impl.init.apply(obj, arguments);`;
  }
  this.str += `
    return obj;
  },
  interface: ${this.name},
  expose: {
    ${exposers.join(",\n    ")}
  }
};\n\n`;
};

Interface.prototype.generateOperations = function () {
  const done = {};
  for (let i = 0; i < this.idl.members.length; ++i) {
    const memberIdl = this.idl.members[i];
    let member = null;

    switch (memberIdl.type) {
      case "operation":
        member = new Operation(this, this.idl, memberIdl);
        if (done[member.name]) {
          continue;
        }
        done[member.name] = true;
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
        if (utils.hasExtAttr(memberIdl.extAttrs, "Unforgeable")) {
          break;
        }
        member = new Attribute(this, this.idl, memberIdl);
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
