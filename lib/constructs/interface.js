"use strict";

const path = require("path");

const utils = require("../utils");
const Attribute = require("./attribute");
const Constant = require("./constant");
const Iterable = require("./iterable");
const Operation = require("./operation");
const Overloads = require("../overloads");
const Parameters = require("../parameters");
const keywords = require("../keywords");

function Interface(idl, opts) {
  this.idl = idl;
  this.name = idl.name;
  this.factory = !!utils.getExtAttr(this.idl.extAttrs, "WebIDL2JSFactory");

  this.mixins = [];
  this.requires = {};
  this.str = null;
  this.opts = opts;
  this.iterable = this.idl.members.some(member => member.type === "iterable");
}

Interface.prototype.type = "interface";

Interface.prototype.implements = function (source) {
  this.mixins.push(source);
};

Interface.prototype.generateIterator = function () {
  if (this.iterable) {
    this.str += `
const IteratorPrototype = Object.create(utils.IteratorPrototype, {
  next: {
    value: function next() {
      const internal = this[utils.iterInternalSymbol];
      const target = internal.target;
      const kind = internal.kind;
      const index = internal.index;
      const values = Array.from(target[impl]);
      const len = values.length;
      if (index >= len) {
        return { value: undefined, done: true };
      }

      const pair = values[index];
      internal.index = index + 1;

      let result;
      switch (kind) {
        case "key":
          result = pair[0];
          break;
        case "value":
          result = pair[1];
          break;
        case "key+value":
          result = [pair[0], pair[1]];
          break;
      }
      return { value: result, done: false };
    },
    writable: true,
    enumerable: true,
    configurable: true
  },
  [Symbol.toStringTag]: {
    value: "${this.name}Iterator",
    writable: false,
    enumerable: false,
    configurable: true
  }
});`;
  }
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
  if (!new.target) {
    throw new TypeError("Failed to construct '${this.name}'. Please use the 'new' operator; this constructor cannot be called as a function.");
  }
  if (arguments.length < ${minConstructor.nameList.length}) {
    throw new TypeError("Failed to construct '${this.name}': ${minConstructor.nameList.length} argument${plural} required, but only " + arguments.length + " present.");
  }`;
    }
    this.str += conversions.body + "\n";

    this.str += `
  iface.setup(this, args);
}\n`;
  } else {
    this.str += `function ${this.name}() {
  throw new TypeError("Illegal constructor");
}\n`;
  }

  if (this.idl.inheritance) {
    this.str += `Object.setPrototypeOf(${this.name}.prototype, ${this.idl.inheritance}.interface.prototype);
Object.setPrototypeOf(${this.name}, ${this.idl.inheritance}.name);\n`;
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
      requireStr += `const ${this.mixins[i]} = require("./${this.mixins[i]}.js");\n`;
    }
  }

  for (let key in this.requires) {
    requireStr += `const ${key} = ${this.requires[key]};\n`;
  }

  requireStr += `\n`;
  this.str = requireStr + this.str;
};

Interface.prototype.generateMixins = function () {
  this.str += `\n`;
  for (let i = 0; i < this.mixins.length; ++i) {
    this.str += `mixin(${this.name}.prototype, ${this.mixins[i]}.interface.prototype);
${this.mixins[i]}.mixedInto.push(${this.name});\n`;
  }
};

Interface.prototype.generateExport = function () {
  this.str += `
  mixedInto: [],
  is(obj) {
    if (obj) {
      if (obj[impl] instanceof Impl.implementation) {
        return true;
      }
      for (let i = 0; i < module.exports.mixedInto.length; ++i) {
        if (obj instanceof module.exports.mixedInto[i]) {
          return true;
        }
      }
    }
    return false;
  },
  isImpl(obj) {
    if (obj) {
      if (obj instanceof Impl.implementation) {
        return true;
      }

      const wrapper = utils.wrapperForImpl(obj);
      for (let i = 0; i < module.exports.mixedInto.length; ++i) {
        if (wrapper instanceof module.exports.mixedInto[i]) {
          return true;
        }
      }
    }
    return false;
  },`;

  if (this.iterable) {
    this.str += `
  createDefaultIterator(target, kind) {
    const iterator = Object.create(IteratorPrototype);
    iterator[utils.iterInternalSymbol] = {
      target,
      kind,
      index: 0
    };
    return iterator;
  },`;
  }
};

Interface.prototype.generateIface = function () {
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
  this.str += `
  create(constructorArgs, privateData) {
    let obj = Object.create(${this.name}.prototype);
    this.setup(obj, constructorArgs, privateData);
    return obj;
  },
  createImpl(constructorArgs, privateData) {
    let obj = Object.create(${this.name}.prototype);
    this.setup(obj, constructorArgs, privateData);
    return utils.implForWrapper(obj);
  },
  _internalSetup(obj) {`;

    if (this.idl.inheritance) {
      this.str += `
    ${this.idl.inheritance}._internalSetup(obj);\n`;
    }

  for (let i = 0; i < this.idl.members.length; ++i) {
    const memberIdl = this.idl.members[i];
    if (memberIdl.type === "attribute" && (utils.getExtAttr(memberIdl.extAttrs, "Unforgeable") || utils.isGlobal(this.idl))) {
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

  this.str += `
  },
  setup(obj, constructorArgs, privateData) {
    if (!privateData) privateData = {};`;

  if (this.factory) {
    this.str += `
    for (var prop in defaultPrivateData) {
      if (!(prop in privateData)) {
        privateData[prop] = defaultPrivateData[prop];
      }
    }`;
  }

  this.str += `
    privateData.wrapper = obj;

    this._internalSetup(obj);\n`;

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
  }`;
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
      case "iterable":
        member = new Iterable(this, this.idl, memberIdl, { customTypes: this.opts.customTypes });
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
        if (utils.getExtAttr(memberIdl.extAttrs, "Unforgeable") || utils.isGlobal(this.idl)) {
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

Interface.prototype.generateSymbols = function () {
  const unscopables = {};
  for (const member of this.idl.members) {
    if (utils.getExtAttr(member.extAttrs, "Unscopeable")) {
      unscopables[member.name] = true;
    }
  }

  if (Object.keys(unscopables).length) {
    this.str += `
${this.name}.prototype[Symbol.unscopables] = ${JSON.stringify(unscopables, null, '  ')};\n`;
  }
  this.str += `\n${this.name}.prototype[Symbol.toStringTag] = ${JSON.stringify(this.name)};\n`;
};

Interface.prototype.generate = function () {
  this.generateIterator();

  if (this.factory) {
    // TODO: use default function parameters when jsdom requires Node >=6
    this.str += `
module.exports = {
  createInterface: function (defaultPrivateData) {
    defaultPrivateData = defaultPrivateData === undefined ? {} : defaultPrivateData;\n\n`;
  }

  this.generateConstructor();
  this.generateMixins();

  this.generateOperations();
  this.generateAttributes();

  this.generateRequires();

  this.generateSymbols();

  this.str += `
const iface = {`;

  if (this.factory) {
    this.generateIface();
    this.str += `
};
return iface;
  },`;
    this.generateExport();
    this.str += `
};\n`;
  } else {
    this.generateExport();
    this.generateIface();
    this.str += `
};
module.exports = iface;\n`;
  }
};

Interface.prototype.toString = function () {
  this.str = "";
  this.generate();
  return this.str;
};

module.exports = Interface;
