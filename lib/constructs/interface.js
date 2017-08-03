"use strict";

const utils = require("../utils");
const Attribute = require("./attribute");
const Constant = require("./constant");
const Iterable = require("./iterable");
const Operation = require("./operation");
const Types = require("../types");
const Overloads = require("../overloads");
const Parameters = require("../parameters");
const keywords = require("../keywords");

function isPropGetter(idl) {
  return idl.type === "operation" && idl.getter && Array.isArray(idl.arguments) && idl.arguments.length === 1;
}

function isPropSetter(idl) {
  return idl.type === "operation" && idl.setter && Array.isArray(idl.arguments) && idl.arguments.length === 2;
}

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

    this.indexedGetter = this.inheritedMembers.find(inner => isPropGetter(inner) && isIndexed(inner));
    this.indexedSetter = this.inheritedMembers.find(inner => isPropSetter(inner) && isIndexed(inner));
    this.namedGetter = this.inheritedMembers.find(inner => isPropGetter(inner) && isNamed(inner));
    this.namedSetter = this.inheritedMembers.find(inner => isPropSetter(inner) && isNamed(inner));
    this.namedDeleter = this.inheritedMembers.find(inner => isPropDeleter(inner) && isNamed(inner));
  }

  get supportsIndexedProperties() {
    return Boolean(this.indexedGetter);
  }

  get supportsNamedProperties() {
    return Boolean(this.namedGetter);
  }

  // TODO: Figure out how iterable<> declarations work with inheritance.
  get hasValueIterator() {
    return this.supportsIndexedProperties && this.idl.members.some(isValueIterable);
  }

  get hasPairIterator() {
    return !this.supportsIndexedProperties && this.idl.members.some(isPairIterable);
  }

  get isLegacyPlatformObj() {
    return !utils.isGlobal(this.idl) && (this.supportsIndexedProperties || this.supportsNamedProperties);
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

  get inheritedMembers() {
    if (!this.idl.inheritance || !this.ctx.interfaces.has(this.idl.inheritance)) {
      return [...this.idl.members];
    }
    const parent = this.ctx.interfaces.get(this.idl.inheritance);
    return [...this.idl.members, ...parent.inheritedMembers];
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

  generateLegacyProxy() {
    const hasIndexedSetter = this.indexedSetter !== undefined;
    const hasNamedSetter = this.namedSetter !== undefined;
    const hasNamedDeleter = this.namedDeleter !== undefined;
    const overrideBuiltins = Boolean(utils.getExtAttr(this.idl.extAttrs, "OverrideBuiltins"));

    const supportsPropertyIndex = (O, index, indexedValue) => {
      let unsupportedValue = utils.getExtAttr(this.indexedGetter.extAttrs, "WebIDL2JSValueAsUnsupported");
      if (unsupportedValue) {
        unsupportedValue = unsupportedValue.rhs.value;
      }
      if (unsupportedValue) {
        const func = this.indexedGetter.name !== null ? `.${this.indexedGetter.name}` : "[utils.indexedGet]";
        const value = indexedValue || `${O}[impl]${func}(${index})`;
        return `${value} !== ${unsupportedValue}`;
      }
      return `${O}[impl][utils.supportsPropertyIndex](${index})`;
    }

    const supportsPropertyName = (O, P, namedValue) => {
      let unsupportedValue = utils.getExtAttr(this.namedGetter.extAttrs, "WebIDL2JSValueAsUnsupported");
      if (unsupportedValue) {
        unsupportedValue = unsupportedValue.rhs.value;
      }
      if (unsupportedValue) {
        const func = this.namedGetter.name !== null ? `.${this.namedGetter.name}` : "[utils.namedGet]";
        const value = namedValue || `${O}[impl]${func}(${P})`;
        return `${value} !== ${unsupportedValue}`;
      }
      return `${O}[impl][utils.supportsPropertyName](${P})`;
    }

    // "named property visibility algorithm"
    // If `supports` is true then skip the supportsPropertyName check.
    function namedPropertyVisible(P, O, supports = false) {
      const conditions = [];
      if (!supports) {
        conditions.push(supportsPropertyName(O, P));
      }
      if (overrideBuiltins) {
        conditions.push(`!Object.prototype.hasOwnProperty.call(${O}, ${P})`);
      } else {
        // TODO: create a named properties object.
        conditions.push(`!(${P} in ${O})`);
      }
      return conditions.join(" && ");
    }

    // "invoke an indexed property setter"
    const invokeIndexedSetter = (O, P, V) => {
      const arg = this.indexedSetter.arguments[1];
      const conv = Types.generateTypeConversion(
        this.ctx, "indexedValue", arg.idlType, arg.extAttrs, this.name,
        `"Failed to set the " + index + " property on '${this.name}': The provided value"`);
      this.requires.merge(conv.requires);

      let str = `
        const index = ${P} >>> 0;
        let indexedValue = ${V};
        ${conv.body}
      `;

      if (this.indexedSetter.name === null) {
        str += `
          const creating = !(${supportsPropertyIndex(O, "index")});
          if (creating) {
            ${O}[impl][utils.indexedSetNew](index, indexedValue);
          } else {
            ${O}[impl][utils.indexedSetExisting](index, indexedValue);
          }
        `;
      } else {
        str += `
          ${O}[impl].${this.indexedSetter.name}(index, indexedValue);
        `;
      }

      return str;
    };

    // "invoke a named property setter"
    const invokeNamedSetter = (O, P, V) => {
      const arg = this.namedSetter.arguments[1];
      const conv = Types.generateTypeConversion(
        this.ctx, "namedValue", arg.idlType, arg.extAttrs, this.name,
        `"Failed to set the '" + ${P} + "' property on '${this.name}': The provided value"`);
      this.requires.merge(conv.requires);

      let str = `
        let namedValue = ${V};
        ${conv.body}
      `;

      if (this.namedSetter.name === null) {
        str += `
          const creating = !(${supportsPropertyName(O, P)});
          if (creating) {
            ${O}[impl][utils.namedSetNew](${P}, namedValue);
          } else {
            ${O}[impl][utils.namedSetExisting](${P}, namedValue);
          }
        `;
      } else {
        str += `
          ${O}[impl].${this.namedSetter.name}(${P}, namedValue);
        `;
      }

      return str;
    };

    this.str += `
      obj = new Proxy(obj, {
    `;

    // [[Get]] (necessary because of proxy semantics)
    this.str += `
        get(target, P, receiver) {
          if (typeof P === "symbol") {
            return Reflect.get(target, P, receiver);
          }
          const desc = this.getOwnPropertyDescriptor(target, P);
          if (desc === undefined) {
            const parent = Object.getPrototypeOf(target);
            if (parent === null) {
              return undefined;
            }
            return Reflect.get(target, P, receiver);
          }
          if (!desc.get && !desc.set) {
            return desc.value;
          }
          const getter = desc.get;
          if (getter === undefined) {
            return undefined;
          }
          return Reflect.apply(getter, receiver, []);
        },
    `;

    // [[HasProperty]] (necessary because of proxy semantics)
    this.str += `
        has(target, P) {
          if (typeof P === "symbol") {
            return Reflect.has(target, P);
          }
          const desc = this.getOwnPropertyDescriptor(target, P);
          if (desc !== undefined) {
            return true;
          }
          const parent = Object.getPrototypeOf(target);
          if (parent !== null) {
            return Reflect.has(parent, P);
          }
          return false;
        },
    `;

    // [[OwnPropertyKeys]]
    // Loosely defined by https://heycam.github.io/webidl/#legacy-platform-object-property-enumeration, but with finer
    // points tuned according to Firefox until https://github.com/heycam/webidl/issues/400 is resolved.
    this.str += `
        ownKeys(target) {
          const keys = new Set();
    `;
    if (this.supportsIndexedProperties) {
      this.str += `
          for (const key of target[impl][utils.supportedPropertyIndices]) {
            keys.add(\`\${key}\`);
          }
      `;
    }
    if (this.supportsNamedProperties) {
      this.str += `
          for (const key of target[impl][utils.supportedPropertyNames]) {
            if (${namedPropertyVisible("key", "target", true)}) {
              keys.add(\`\${key}\`);
            }
          }
      `;
    }
    this.str += `
          for (const key of Reflect.ownKeys(target)) {
            keys.add(key);
          }
          return [...keys];
        },
    `;

    // [[GetOwnProperty]]
    this.str += `
        getOwnPropertyDescriptor(target, P) {
          if (typeof P === "symbol") {
            return Reflect.getOwnPropertyDescriptor(target, P);
          }
          let ignoreNamedProps = false;
    `;
    if (this.supportsIndexedProperties) {
      this.str += `
          if (utils.isArrayIndexPropName(P)) {
            const index = P >>> 0;
      `;

      const func = this.indexedGetter.name !== null ? `.${this.indexedGetter.name}` : "[utils.indexedGet]";
      let preamble = "";
      let condition;
      if (utils.getExtAttr(this.indexedGetter.extAttrs, "WebIDL2JSValueAsUnsupported")) {
        this.str += `const indexedValue = target[impl]${func}(index);`;
        condition = supportsPropertyIndex("target", "index", "indexedValue");
      } else {
        preamble = `const indexedValue = target[impl]${func}(index);`;
        condition = supportsPropertyIndex("target", "index");
      }

      this.str += `
            if (${condition}) {
              ${preamble}
              return {
                writable: ${hasIndexedSetter},
                enumerable: true,
                configurable: true,
                value: utils.tryWrapperForImpl(indexedValue)
              };
            }
            ignoreNamedProps = true;
          }
      `;
    }
    if (this.supportsNamedProperties) {
      const func = this.namedGetter.name !== null ? `.${this.namedGetter.name}` : "[utils.namedGet]";
      const enumerable = !utils.getExtAttr(this.idl.extAttrs, "LegacyUnenumerableNamedProperties");
      let preamble = "";
      const conditions = [];
      if (utils.getExtAttr(this.namedGetter.extAttrs, "WebIDL2JSValueAsUnsupported")) {
        this.str += `
          const namedValue = target[impl]${func}(P);
        `;
        conditions.push(supportsPropertyName("target", "index", "namedValue"));
        conditions.push(namedPropertyVisible("P", "target", true));
      } else {
        preamble = `
          const namedValue = target[impl]${func}(P);
        `;
        conditions.push(namedPropertyVisible("P", "target", false));
      }
      conditions.push("!ignoreNamedProps");
      this.str += `
          if (${conditions.join(" && ")}) {
            ${preamble}
            return {
              writable: ${hasNamedSetter},
              enumerable: ${enumerable},
              configurable: true,
              value: utils.tryWrapperForImpl(namedValue)
            };
          }
      `;
    }
    this.str += `
          return Reflect.getOwnPropertyDescriptor(target, P);
        },
    `;

    // [[Set]]
    this.str += `
        set(target, P, V, receiver) {
          if (typeof P === "symbol") {
            return Reflect.set(target, P, V, receiver);
          }
          if (target === receiver) {
    `;

    if (this.supportsIndexedProperties) {
      if (hasIndexedSetter) {
        this.str += `
            if (utils.isArrayIndexPropName(P)) {
              ${invokeIndexedSetter("target", "P", "V")}
              return true;
            }
        `;
      } else {
        // Side-effects
        this.str += `
            utils.isArrayIndexPropName(P);
        `;
      }
    }
    if (this.supportsNamedProperties) {
      if (hasNamedSetter) {
        this.str += `
            if (typeof P === "string" && !utils.isArrayIndexPropName(P)) {
              ${invokeNamedSetter("target", "P", "V")}
              return true;
            }
        `;
      } else {
        // Side-effects
        this.str += `
            typeof P === "string" && !utils.isArrayIndexPropName(P);
        `;
      }
    }

    this.str += `
          }
          let ownDesc;
    `;
    if (this.supportsIndexedProperties) {
      this.str += `
          if (utils.isArrayIndexPropName(P)) {
            const index = P >>> 0;
      `;

      const func = this.indexedGetter.name !== null ? `.${this.indexedGetter.name}` : "[utils.indexedGet]";
      let preamble = "";
      let condition;
      if (utils.getExtAttr(this.indexedGetter.extAttrs, "WebIDL2JSValueAsUnsupported")) {
        this.str += `const indexedValue = target[impl]${func}(index);`;
        condition = supportsPropertyIndex("target", "index", "indexedValue");
      } else {
        preamble = `const indexedValue = target[impl]${func}(index);`;
        condition = supportsPropertyIndex("target", "index");
      }

      this.str += `
            if (${condition}) {
              ${preamble}
              ownDesc = {
                writable: ${hasIndexedSetter},
                enumerable: true,
                configurable: true,
                value: utils.tryWrapperForImpl(indexedValue)
              };
            }
          }
      `;
    }
    this.str += `
          if (ownDesc === undefined) {
            ownDesc = Reflect.getOwnPropertyDescriptor(target, P);
          }
          if (ownDesc === undefined) {
            const parent = Reflect.getPrototypeOf(target);
            if (parent !== null) {
              return Reflect.set(parent, P, V, receiver);
            }
            ownDesc = { writable: true, enumerable: true, configurable: true, value: undefined };
          }
          if (!ownDesc.writable) {
            return false;
          }
          if (!utils.isObject(receiver)) {
            return false;
          }
          const existingDesc = Reflect.getOwnPropertyDescriptor(receiver, P);
          let valueDesc;
          if (existingDesc !== undefined) {
            if (existingDesc.get || existingDesc.set) {
              return false;
            }
            if (!existingDesc.writable) {
              return false;
            }
            valueDesc = { value: V };
          } else {
            valueDesc = { writable: true, enumerable: true, configurable: true, value: V };
          }
          return Reflect.defineProperty(receiver, P, valueDesc);
        },
    `;

    // [[DefineOwnProperty]]
    this.str += `
        defineProperty(target, P, desc) {
          if (typeof P === "symbol") {
            return Reflect.defineProperty(target, P, desc);
          }
    `;
    if (this.supportsIndexedProperties) {
      this.str += `
          if (utils.isArrayIndexPropName(P)) {
      `;
      if (hasIndexedSetter) {
        this.str += `
            if (desc.get || desc.set) {
              return false;
            }
            ${invokeIndexedSetter("target", "P", "desc.value")}
            return true;
        `;
      } else {
        this.str += `
            return false;
        `;
      }
      this.str += `
          }
      `;
    }
    let needFallback = false;
    if (this.supportsNamedProperties && !utils.isGlobal(this.idl)) {
      const unforgeable = this.idl.members.filter(m => utils.getExtAttr(m.extAttrs, "Unforgeable")).map(m => m.name);
      if (unforgeable.length > 0) {
        needFallback = true;
        this.str += `if (!${JSON.stringify(unforgeable)}.includes(P)) {`;
      }
      if (!overrideBuiltins) {
        needFallback = true;
        this.str += "if (!Object.prototype.hasOwnProperty.call(target, P)) {";
      }

      if (!hasNamedSetter) {
        needFallback = true;
        this.str += `
          const creating = !(${supportsPropertyName("target", "P")});
          if (!creating) {
            return false;
          }
        `;
      } else {
        this.str += `
          if (desc.get || desc.set) {
            return false;
          }
          ${invokeNamedSetter("target", "P", "desc.value")}
          return true;
        `;
      }

      if (!overrideBuiltins) {
        this.str += "}";
      }
      if (unforgeable.length > 0) {
        this.str += "}";
      }
    } else {
      needFallback = true;
    }
    if (needFallback) {
      // Spec says to set configurable to true, but doing so will make Proxy's trap throw and also fail WPT.
      // if (!utils.isGlobal(this.idl)) {
      //   this.str += `
      //     desc.configurable = true;
      //   `;
      // }
      this.str += `
          return Reflect.defineProperty(target, P, desc);
      `;
    }
    this.str += `
        },
    `;

    // [[Delete]]
    this.str += `
        deleteProperty(target, P) {
          if (typeof P === "symbol") {
            return Reflect.deleteProperty(target, P);
          }
    `;
    if (this.supportsIndexedProperties) {
      this.str += `
          if (utils.isArrayIndexPropName(P)) {
            const index = P >>> 0;
            return !(${supportsPropertyIndex("target", "index")});
          }
      `;
    }
    if (this.supportsNamedProperties && !utils.isGlobal(this.idl)) {
      this.str += `
          if (${namedPropertyVisible("P", "target")}) {
      `;
      if (!hasNamedDeleter) {
        this.str += `
            return false;
        `;
      } else {
        const func = this.namedDeleter.name !== null ? `.${this.namedDeleter.name}` : "[utils.namedDelete]";
        if (this.namedDeleter.idlType.idlType === "bool") {
          this.str += `
            return target[impl]${func}(P);
          `;
        } else {
          this.str += `
            target[impl]${func}(P);
            return true;
          `;
        }
      }
      this.str += `
          }
      `;
    }
    this.str += `
          return Reflect.deleteProperty(target, P);
        },
    `;

    // TODO: Implement [[Call]] / legacycallers.

    // [[PreventExtensions]]
    this.str += `
        preventExtensions() {
          return false;
        }
    `;

    this.str += `
      });
    `;
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
    `;

    if (this.isLegacyPlatformObj) {
      this.generateLegacyProxy();
    }

    this.str += `
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

    this.generateRequires();
  }

  toString() {
    this.str = "";
    this.generate();
    return this.str;
  }
}

Interface.prototype.type = "interface";

module.exports = Interface;
