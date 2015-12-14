"use strict";

const path = require("path");

const utils = require("../utils");
const Attribute = require("./attribute");
const Constant = require("./constant");
const Operation = require("./operation");
const Overloads = require("../overloads");
const Parameters = require("../parameters");

function Interface(idl, opts) {
  this.idl = idl;
  this.name = idl.name;

  this.mixins = [];
  this.requires = {};
  this.str = null;
  this.opts = opts;
}

Interface.prototype.type = "interface";

Interface.prototype.implements = function (source) {
  this.mixins.push(source);
};

Interface.prototype.generateConstructor = function () {
  const overloads = Overloads.getEffectiveOverloads("constructor", 0, this.idl, null);

  if (overloads.length !== 0) {
    let minConstructor = overloads[0];

    for (let i = 1; i < overloads.length; ++i) {
      if (overloads[i].nameList.length < minConstructor.nameList.length) {
        minConstructor = overloads[i];
      }
    }

    const conversions = Parameters.generateOverloadConversions(overloads, this.opts.customTypes);
    Object.assign(this.requires, conversions.requires);

    minConstructor.nameList = minConstructor.nameList.map((name) => (keywords.has(name) ? "_" : "") + name);
    this.str += `function ${this.name}(${minConstructor.nameList.join(", ")}) {`;
    if (minConstructor.nameList.length !== 0) {
      const plural = minConstructor.nameList.length > 1 ? "s" : "";
      this.str += `
  if (!this || this[impl] || !(this instanceof ${this.name})) {
    throw new TypeError("Failed to construct '${this.name}': Please use the 'new' operator, this DOM object constructor cannot be called as a function.");
  }
  if (arguments.length < ${minConstructor.nameList.length}) {
    throw new TypeError("Failed to construct '${this.name}': ${minConstructor.nameList.length} argument${plural} required, but only " + arguments.length + " present.");
  }`;
    }
    this.str += conversions.body + "\n";

    this.str += `
  module.exports.setup(this, args);
}\n`;
  } else {
    this.str += `function ${this.name}() {
  throw new TypeError("Illegal constructor");
}\n`;
  }

  if (this.idl.inheritance) {
    this.str += `${this.name}.prototype = Object.create(${this.idl.inheritance}.interface.prototype);
${this.name}.prototype.constructor = ${this.name};\n`;
  }
};

Interface.prototype.generateRequires = function () {
  let requireStr = ``;

  if (this.idl.inheritance !== null) {
    requireStr += `const ${this.idl.inheritance} = require("./${this.idl.inheritance}.js");\n`;
  }

  requireStr += `const impl = utils.implSymbol;\n`;

  if (this.mixins.length !== 0) {
    requireStr += `const mixin = utils.mixin;\n`;
    for (let i = 0; i < this.mixins.length; ++i) {
      requireStr += `const ${this.mixins[i]} = require("./${this.mixins[i]}.js").interface;\n`;
    }
  }

  if (this.idl.inheritance !== "Element" && this.mixins.indexOf("Element") === -1) {
    let needsElement = false;
    for (let i = 0; i < this.idl.members.length; ++i) {
      const memberIdl = this.idl.members[i];
      if (memberIdl.type === "attribute" && utils.getExtAttr(memberIdl.extAttrs, "Reflect")) {
        needsElement = true;
        break;
      }
    }
    if (needsElement) {
      requireStr += `const Element = require("./Element.js").interface;\n`;
    }
  }

  for (let key in this.requires) {
    requireStr += `const ${key} = ${this.requires[key]};\n`;
  }

  requireStr += `\n`;
  this.str = requireStr + this.str;
};

Interface.prototype.generateMixins = function () {
  for (let i = 0; i < this.mixins.length; ++i) {
    this.str += `mixin(${this.name}.prototype, ${this.mixins[i]}.prototype);\n`;
  }
};

Interface.prototype.generateExport = function () {
  const shouldExposeRoot = !utils.getExtAttr(this.idl.extAttrs, "NoInterfaceObject");

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

  // since we don't have spread arg calls, we can't do new Interface(...arguments) yet
  // add initialized symbol as to not destroy the object shape and cause deopts
  this.str += `\nmodule.exports = {
  is(obj) {
    return !!obj && obj[impl] instanceof Impl.implementation;
  },
  create(constructorArgs, privateData) {
    let obj = Object.create(${this.name}.prototype);
    this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  setup(obj, constructorArgs, privateData) {
    if (!privateData) privateData = {};
    privateData.wrapper = obj;\n`;

  for (let i = 0; i < this.idl.members.length; ++i) {
    const memberIdl = this.idl.members[i];
    if (memberIdl.type === "attribute" && utils.getExtAttr(memberIdl.extAttrs, "Unforgeable")) {
      const member = new Attribute(this, this.idl, memberIdl);
      this.str += "\n    " + member.generate().body.replace(/\n/g, '\n    ');
    }
  }

  if (utils.getExtAttr(this.idl.extAttrs, "Unforgeable")) {
    this.str += `
    Object.defineProperty(obj, "valueOf", {
      value: function valueOf() { return this; },
      enumerable: true
    });\n`;
  }

  const implClass = require(this.opts.implDir + "/" + this.name + this.opts.implSuffix);
  this.str += `
    obj[impl] = new Impl.implementation(constructorArgs, privateData);
    obj[impl][utils.wrapperSymbol] = obj;`;
    if (implClass.init) {
      this.str += `
    Impl.init(obj[impl], privateData);`;
  }
  this.str += `
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
        member = new Operation(this, this.idl, memberIdl, { customTypes: this.opts.customTypes });
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
      const data = member.generate();
      Object.assign(this.requires, data.requires),
      this.str += data.body;
    }
  }
};

Interface.prototype.generateAttributes = function () {
  for (let i = 0; i < this.idl.members.length; ++i) {
    const memberIdl = this.idl.members[i];
    let member = null;

    switch (memberIdl.type) {
      case "attribute":
        if (utils.getExtAttr(memberIdl.extAttrs, "Unforgeable")) {
          break;
        }
        member = new Attribute(this, this.idl, memberIdl);
        break;
      case "const":
        member = new Constant(this, this.idl, memberIdl);
        break;
      default:
        //throw new Error("Can't handle member of type '" + memberIdl.type + "'");
        break;
    }

    if (member !== null) {
      const data = member.generate();
      Object.assign(this.requires, data.requires);
      this.str += data.body;
    }
  }
};

Interface.prototype.generate = function () {
  this.generateConstructor();
  this.generateMixins();

  this.generateOperations();

  this.generateAttributes();
  this.generateRequires();

  this.generateExport();
};

Interface.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Interface;
