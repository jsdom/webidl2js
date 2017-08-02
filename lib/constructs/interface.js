"use strict";

const utils = require("../utils");
const Attribute = require("./attribute");
const Constant = require("./constant");
const Iterable = require("./iterable");
const Operation = require("./operation");
const Overloads = require("../overloads");
const Parameters = require("../parameters");
const keywords = require("../keywords");

function isPropGetter(idl) {
  return idl.type === "operation" && idl.getter && Array.isArray(idl.arguments) && idl.arguments.length === 1;
}

// eslint-disable-next-line no-unused-vars
function isPropSetter(idl) {
  return idl.type === "operation" && idl.setter && Array.isArray(idl.arguments) && idl.arguments.length === 2;
}

// eslint-disable-next-line no-unused-vars
function isPropDeleter(idl) {
  return idl.type === "operation" && idl.deleter && Array.isArray(idl.arguments) && idl.arguments.length === 1;
}

function isNamed(idl) {
  return idl.arguments[0].idlType.idlType === "DOMString";
}

function isIndexed(idl) {
  return idl.arguments[0].idlType.idlType === "unsigned long";
}

function isValueIterable(idl) {
  return idl.type === "iterable" && !Array.isArray(idl.idlType);
}

function isPairIterable(idl) {
  return idl.type === "iterable" && Array.isArray(idl.idlType) && idl.idlType.length === 2;
}

class Interface {
  constructor(ctx, idl, opts) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;
    this.factory = Boolean(utils.getExtAttr(this.idl.extAttrs, "WebIDL2JSFactory"));

    this.str = null;
    this.opts = opts;
    this.requires = new utils.RequiresMap(ctx);
    this.mixins = [];
  }

  get supportsIndexedProperties() {
    return this.idl.members.some(idl => isPropGetter(idl) && isIndexed(idl));
  }

  get supportsNamedProperties() {
    return this.idl.members.some(idl => isPropGetter(idl) && isNamed(idl));
  }

  get hasValueIterator() {
    return this.supportsIndexedProperties && this.idl.members.some(isValueIterable);
  }

  get hasPairIterator() {
    return !this.supportsIndexedProperties && this.idl.members.some(isPairIterable);
  }

  implements(source) {
    this.mixins.push(source);
  }

  generateIterator() {
    if (this.hasPairIterator) {
      this.str += `
        const IteratorPrototype = Object.create(utils.IteratorPrototype, {
          next: {
            value: function next() {
              const internal = this[utils.iterInternalSymbol];
              const { target, kind, index } = internal;
              const values = Array.from(target[impl]);
              const len = values.length;
              if (index >= len) {
                return { value: undefined, done: true };
              }

              const pair = values[index];
              internal.index = index + 1;
              const [key, value] = pair.map(utils.tryWrapperForImpl);

              let result;
              switch (kind) {
                case "key":
                  result = key;
                  break;
                case "value":
                  result = value;
                  break;
                case "key+value":
                  result = [key, value];
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
        });
      `;
    }
  }

  generateConstructor() {
    const overloads = Overloads.getEffectiveOverloads("constructor", 0, this.idl, null);

    if (overloads.length !== 0) {
      let minConstructor = overloads[0];

      for (let i = 1; i < overloads.length; ++i) {
        if (overloads[i].nameList.length < minConstructor.nameList.length) {
          minConstructor = overloads[i];
        }
      }

      const conversions =
        Parameters.generateOverloadConversions(this.ctx, overloads, this.name, `Failed to construct '${this.name}': `);
      this.requires.merge(conversions.requires);

      minConstructor.nameList = minConstructor.nameList.map(name => (keywords.has(name) ? "_" : "") + name);
      this.str += `
        function ${this.name}(${minConstructor.nameList.join(", ")}) {
      `;
      if (minConstructor.nameList.length !== 0) {
        const plural = minConstructor.nameList.length > 1 ? "s" : "";
        this.str += `
          if (!new.target) {
            throw new TypeError("Failed to construct '${this.name}'. Please use the 'new' operator; this constructor " +
                                "cannot be called as a function.");
          }
          if (arguments.length < ${minConstructor.nameList.length}) {
            throw new TypeError("Failed to construct '${this.name}': ${minConstructor.nameList.length} " +
                                "argument${plural} required, but only " + arguments.length + " present.");
          }
        `;
      }
      this.str += conversions.body + "\n";

      const passArgs = conversions.hasArgs ? ", args" : "";
      this.str += `
          iface.setup(this${passArgs});
        }
      `;
    } else {
      this.str += `
        function ${this.name}() {
          throw new TypeError("Illegal constructor");
        }
      `;
    }

    if (this.idl.inheritance) {
      this.str += `
        Object.setPrototypeOf(${this.name}.prototype, ${this.idl.inheritance}.interface.prototype);
        Object.setPrototypeOf(${this.name}, ${this.idl.inheritance}.interface);
      `;
    }

    this.str += `
      Object.defineProperty(${this.name}, "prototype", {
        value: ${this.name}.prototype,
        writable: false,
        enumerable: false,
        configurable: false
      });
    `;
  }

  generateRequires() {
    this.requires.addRaw("impl", "utils.implSymbol");

    if (this.idl.inheritance !== null) {
      this.requires.add(this.idl.inheritance);
    }

    if (this.mixins.length !== 0) {
      this.requires.addRaw("mixin", "utils.mixin");
      for (const mixin of this.mixins) {
        this.requires.add(mixin);
      }
    }

    this.str = `
      ${this.requires.generate()}

      ${this.str}
    `;
  }

  generateMixins() {
    for (const mixin of this.mixins) {
      this.str += `
        mixin(${this.name}.prototype, ${mixin}.interface.prototype);
        ${mixin}.mixedInto.push(${this.name});
      `;
    }
  }

  generateExport() {
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
      },
      convert(obj, { context = "The provided value" } = {}) {
        if (module.exports.is(obj)) {
          return utils.implForWrapper(obj);
        }
        throw new TypeError(\`\${context} is not of type '${this.name}'.\`);
      },
    `;

    if (this.hasPairIterator) {
      this.str += `
        createDefaultIterator(target, kind) {
          const iterator = Object.create(IteratorPrototype);
          Object.defineProperty(iterator, utils.iterInternalSymbol, {
            value: { target, kind, index: 0 },
            writable: false,
            enumerable: false,
            configurable: true
          });
          return iterator;
        },
      `;
    }
  }

  generateIface() {
    const shouldExposeRoot = !utils.getExtAttr(this.idl.extAttrs, "NoInterfaceObject");

    const exposedMap = {};
    if (shouldExposeRoot) {
      let exposedOn = ["Window"];
      const exposedAttrs = this.idl.extAttrs
        .filter(attr => attr.name === "Exposed");
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

    const exposers = [];
    for (let keys = Object.keys(exposedMap), i = 0; i < keys.length; ++i) {
      exposers.push(keys[i] + ": { " + exposedMap[keys[i]].join(", ") + " }");
    }

    // since we don't have spread arg calls, we can't do new Interface(...arguments) yet
    // add initialized symbol as to not destroy the object shape and cause deopts
    this.str += `
      create(constructorArgs, privateData) {
        let obj = Object.create(${this.name}.prototype);
        obj = this.setup(obj, constructorArgs, privateData);
        return obj;
      },
      createImpl(constructorArgs, privateData) {
        let obj = Object.create(${this.name}.prototype);
        obj = this.setup(obj, constructorArgs, privateData);
        return utils.implForWrapper(obj);
      },
      _internalSetup(obj) {
    `;

    if (this.idl.inheritance) {
      this.str += `
        ${this.idl.inheritance}._internalSetup(obj);
      `;
    }

    for (let i = 0; i < this.idl.members.length; ++i) {
      const memberIdl = this.idl.members[i];
      if (utils.isOnInstance(memberIdl, this.idl)) {
        let member;
        switch (memberIdl.type) {
          case "operation": {
            member = new Operation(this.ctx, this, this.idl, memberIdl);
            break;
          }
          case "attribute": {
            member = new Attribute(this.ctx, this, this.idl, memberIdl);
            break;
          }
          default: {
            throw new Error("Cannot handle on-instance members that are not operations or attributes");
          }
        }

        this.str += member.generate().body;
      }
    }

    this.str += `
      },
      setup(obj, constructorArgs, privateData) {
        if (!privateData) privateData = {};
    `;

    if (this.factory) {
      this.str += `
        for (var prop in defaultPrivateData) {
          if (!(prop in privateData)) {
            privateData[prop] = defaultPrivateData[prop];
          }
        }
      `;
    }

    this.str += `
        privateData.wrapper = obj;

        this._internalSetup(obj);
        Object.defineProperty(obj, impl, {
          value: new Impl.implementation(constructorArgs, privateData),
          writable: false,
          enumerable: false,
          configurable: true
        });
        obj[impl][utils.wrapperSymbol] = obj;
        if (Impl.init) {
          Impl.init(obj[impl], privateData);
        }
        return obj;
      },
      interface: ${this.name},
      expose: {
        ${exposers.join(",\n    ")}
      }
    `;
  }

  generateOperations() {
    // TODO maplike setlike
    // Don't bother checking "length" attribute as interfaces that support indexed properties must implement one.
    // "Has value iterator" implies "supports indexed properties".
    if (this.supportsIndexedProperties || this.hasPairIterator) {
      let expr;

      if (this.supportsIndexedProperties) {
        expr = "Array.prototype[Symbol.iterator]";
      } else {
        expr = `
          function entries() {
            if (!this || !module.exports.is(this)) {
              throw new TypeError("Illegal invocation");
            }
            return module.exports.createDefaultIterator(this, "key+value");
          }
        `;
      }

      this.str += `
        Object.defineProperty(${this.name}.prototype, Symbol.iterator, {
          writable: true,
          enumerable: false,
          configurable: true,
          value: ${expr}
        });
      `;
    }

    if (this.hasValueIterator || this.hasPairIterator) {
      let expr;

      if (this.hasValueIterator) {
        expr = "Array.prototype.forEach";
      } else {
        expr = `
          function forEach(callback) {
            if (!this || !module.exports.is(this)) {
              throw new TypeError("Illegal invocation");
            }
            if (arguments.length < 1) {
              throw new TypeError("Failed to execute 'forEach' on '${this.name}': 1 argument required, " +
                                  "but only 0 present.");
            }
            if (typeof callback !== "function") {
              throw new TypeError("Failed to execute 'forEach' on '${this.name}': The callback provided " +
                                  "as parameter 1 is not a function.");
            }
            const thisArg = arguments[1];
            let pairs = Array.from(this[impl]);
            let i = 0;
            while (i < pairs.length) {
              const [key, value] = pairs[i].map(utils.tryWrapperForImpl);
              callback.call(thisArg, value, key, this);
              pairs = Array.from(this[impl]);
              i++;
            }
          }
        `;
      }

      this.str += `${this.name}.prototype.forEach = ${expr};`;
    }

    const done = {};

    for (let i = 0; i < this.idl.members.length; ++i) {
      const memberIdl = this.idl.members[i];
      let member = null;

      switch (memberIdl.type) {
        case "operation":
          if (utils.isOnInstance(memberIdl, this.idl)) {
            break;
          }
          member = new Operation(this.ctx, this, this.idl, memberIdl);
          if (done[member.name]) {
            continue;
          }
          done[member.name] = true;
          break;
        case "iterable":
          member = new Iterable(this.ctx, this, this.idl, memberIdl);
          break;
        default:
          // throw new Error("Can't handle member of type '" + memberIdl.type + "'");
          break;
      }

      if (member !== null) {
        const data = member.generate();
        this.requires.merge(data.requires);
        this.str += data.body;
      }
    }
  }

  generateAttributes() {
    for (let i = 0; i < this.idl.members.length; ++i) {
      const memberIdl = this.idl.members[i];
      let member = null;

      switch (memberIdl.type) {
        case "attribute":
          if (utils.isOnInstance(memberIdl, this.idl)) {
            break;
          }
          member = new Attribute(this.ctx, this, this.idl, memberIdl);
          break;
        case "const":
          member = new Constant(this.ctx, this, this.idl, memberIdl);
          break;
        default:
          // throw new Error("Can't handle member of type '" + memberIdl.type + "'");
          break;
      }

      if (member !== null) {
        const data = member.generate();
        this.requires.merge(data.requires);
        this.str += data.body;
      }
    }
  }

  generateSymbols() {
    const unscopables = Object.create(null);
    for (const member of this.idl.members) {
      if (utils.getExtAttr(member.extAttrs, "Unscopeable")) {
        unscopables[member.name] = true;
      }
    }

    if (Object.keys(unscopables).length) {
      this.str += `
        Object.defineProperty(${this.name}.prototype, Symbol.unscopables, {
          value: ${JSON.stringify(unscopables, null, "  ")},
          writable: false,
          enumerable: false,
          configurable: true
        });
      `;
    }
    this.str += `
      Object.defineProperty(${this.name}.prototype, Symbol.toStringTag, {
        value: "${this.name}",
        writable: false,
        enumerable: false,
        configurable: true
      });
    `;
  }

  generate() {
    this.generateIterator();

    if (this.factory) {
      this.str += `
        module.exports = {
          createInterface: function (defaultPrivateData = {}) {
      `;
    }

    this.generateConstructor();
    this.generateMixins();

    this.generateOperations();
    this.generateAttributes();

    this.generateRequires();

    this.generateSymbols();

    this.str += `
      const iface = {
    `;

    if (this.factory) {
      this.generateIface();
      this.str += `
          }; // iface
          return iface;
        }, // createInterface
      `;
      this.generateExport();
      this.str += `
        }; // module.exports
      `;
    } else {
      this.generateExport();
      this.generateIface();
      this.str += `
        }; // iface
        module.exports = iface;
      `;
    }
  }

  toString() {
    this.str = "";
    this.generate();
    return this.str;
  }
}

Interface.prototype.type = "interface";

module.exports = Interface;
