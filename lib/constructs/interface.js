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
  this.str = null;
  this.opts = opts;
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

  let implClass = null;
  try {
    implClass = require(this.opts.implDir + "/" + this.name + this.opts.implSuffix);
  } catch (e) {}

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
    this.str += `
    this[initialized] = true;`;
    if (this.idl.inheritance) {
      this.str += `
    super(...arguments);`;
    }
    this.str += Parameters.generateConversions(overloads) + "\n";

    for (let i = 0; i < this.idl.members.length; ++i) {
      const memberIdl = this.idl.members[i];
      if (memberIdl.type === "attribute" && utils.hasExtAttr(memberIdl.extAttrs, "Unforgeable")) {
          const member = new Attribute(this, this.idl, memberIdl);
          this.str += "\n    " + member.toString().replace(/\n/g, '\n    ');
      }
    }
    if (implClass && implClass.init) {
      this.str += `
    Impl.init.apply(obj, arguments);`;
    }
  } else {
    this.str += `
  constructor() {
    if (arguments[0] !== module.exports.secret && !this[initialized]) {
      throw new TypeError("Illegal constructor");
    }
    this[initialized] = true;
    const args = [];
    for (let i = 1; i < arguments.length; ++i) {
      args[i - 1] = arguments[i];
    }`;

    if (this.idl.inheritance) {
      this.str += `
    super(...args);`;
    }
    if (implClass && implClass.init) {
      this.str += `
    Impl.init.apply(this, args);`;
    }
  }
  this.str += `
  }\n`;
};

Interface.prototype.generateRequires = function () {
  if (this.idl.inheritance !== null) {
    this.str += `const ${this.idl.inheritance} = require("./${this.idl.inheritance}.js");\n`;
  }

  this.str += `const impl = Symbol("${this.name} implementation");\n`;

  if (this.mixins.length !== 0) {
    this.str += `const mixin = utils.mixin;\n`;
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

  let implClass = null;
  try {
    implClass = require(this.opts.implDir + "/" + this.name + this.opts.implSuffix);
  } catch (e) {}

  // since we don't have spread arg calls, we can't do new Interface(...arguments) yet
  // add initialized symbol as to not destroy the object shape and cause deopts
  this.str += `\nmodule.exports = {
  create(constructorArgs, privateArgs) {
    let obj = Object.create(${this.name}.prototype);
    this.setup(obj, constructorArgs, privateArgs);
    return obj;
  },
  setup(obj, constructorArgs, privateData) {`
  if (this.idl.inheritance !== null) {
    this.str += `
    ${this.idl.inheritance}.setup(obj, constructorArgs, privateData);`;
  }
  if (implClass) {
    this.str += `
    this[impl] = new (Function.prototype.apply(Impl, [null].concat(Array.prototype.call(constructorArgs))))();`;
    if (implClass.init) {
      this.str += `
    Impl.init(obj[impl], privateData);`;
    }
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
      case "const":
        member = new Constant(this, this.idl, memberIdl);
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
