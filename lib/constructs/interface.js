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

function isNamed(idl) {
  return idl.arguments[0].idlType.idlType === "DOMString";
}
function isIndexed(idl) {
  return idl.arguments[0].idlType.idlType === "unsigned long";
}

function formatArgs(args) {
  return args.map(name => name + (keywords.has(name) ? "_" : "")).join(", ");
}

const defaultDefinePropertyDescriptor = {
  configurable: false,
  enumerable: false,
  writable: false
};

const defaultObjectLiteralDescriptor = {
  configurable: true,
  enumerable: true,
  writable: true
};

const defaultClassMethodDescriptor = {
  configurable: true,
  enumerable: false,
  writable: true
};

// type can be "accessor" or "regular"
function getPropertyDescriptorModifier(currentDesc, targetDesc, type, value = undefined) {
  const changes = [];
  if (value !== undefined) {
    changes.push(`value: ${value}`);
  }
  if (currentDesc.configurable !== targetDesc.configurable) {
    changes.push(`configurable: ${targetDesc.configurable}`);
  }
  if (currentDesc.enumerable !== targetDesc.enumerable) {
    changes.push(`enumerable: ${targetDesc.enumerable}`);
  }
  if (type !== "accessor" && currentDesc.writable !== targetDesc.writable) {
    changes.push(`writable: ${targetDesc.writable}`);
  }

  if (changes.length === 0) {
    return undefined;
  }
  return `{ ${changes.join(", ")} }`;
}

class Interface {
  constructor(ctx, idl, opts) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;

    for (const member of this.idl.members) {
      member.definingInterface = this.name;
    }

    this.str = null;
    this.opts = opts;
    this.requires = new utils.RequiresMap(ctx);
    this.included = [];

    this.constructorOperations = [];
    this.operations = new Map();
    this.staticOperations = new Map();
    this.attributes = new Map();
    this.staticAttributes = new Map();
    this.constants = new Map();

    this.indexedGetter = null;
    this.indexedSetter = null;
    this.namedGetter = null;
    this.namedSetter = null;
    this.namedDeleter = null;
    this.stringifier = null;
    this.needsPerGlobalProxyHandler = false;

    this.iterable = null;
    this._analyzed = false;

    this._outputMethods = new Map();
    this._outputStaticMethods = new Map();
    this._outputProperties = new Map();
    this._outputStaticProperties = new Map();

    const global = utils.getExtAttr(this.idl.extAttrs, "Global");
    this.isGlobal = Boolean(global);
    if (global && !global.rhs) {
      throw new Error(`[Global] must take an identifier or an identifier list in interface ${this.name}`);
    }
  }

  // whence is either "instance" or "prototype"
  // type is either "regular", "get", or "set"
  addMethod(whence, propName, args, body, type = "regular", {
    configurable = true,
    enumerable = typeof propName === "string",
    writable = type === "regular" ? true : undefined
  } = {}) {
    if (whence !== "instance" && whence !== "prototype") {
      throw new Error(`Internal error: Invalid whence ${whence}`);
    }
    if (type !== "regular") {
      const existing = this._outputMethods.get(propName);
      if (existing !== undefined) {
        if (type === "get") {
          existing.body[0] = body;
        } else {
          existing.args = args;
          existing.body[1] = body;
        }
        return;
      }

      const pair = new Array(2);
      pair[type === "get" ? 0 : 1] = body;
      body = pair;
      type = "accessor";
    }

    const descriptor = { configurable, enumerable, writable };
    this._outputMethods.set(propName, { whence, type, args, body, descriptor });
  }

  // type is either "regular", "get", or "set"
  addStaticMethod(propName, args, body, type = "regular", {
    configurable = true,
    enumerable = typeof propName === "string",
    writable = type === "regular" ? true : undefined
  } = {}) {
    if (type !== "regular") {
      const existing = this._outputStaticMethods.get(propName);
      if (existing !== undefined) {
        if (type === "get") {
          existing.body[0] = body;
        } else {
          existing.args = args;
          existing.body[1] = body;
        }
        return;
      }

      const pair = new Array(2);
      pair[type === "get" ? 0 : 1] = body;
      body = pair;
      type = "accessor";
    }

    const descriptor = { configurable, enumerable, writable };
    this._outputStaticMethods.set(propName, { type, args, body, descriptor });
  }

  // whence is either "instance" or "prototype"
  addProperty(whence, propName, str, {
    configurable = true,
    enumerable = typeof propName === "string",
    writable = true
  } = {}) {
    if (whence !== "instance" && whence !== "prototype") {
      throw new Error(`Internal error: Invalid whence ${whence}`);
    }
    const descriptor = { configurable, enumerable, writable };
    this._outputProperties.set(propName, { whence, body: str, descriptor });
  }

  addStaticProperty(propName, str, {
    configurable = true,
    enumerable = typeof propName === "string",
    writable = true
  } = {}) {
    const descriptor = { configurable, enumerable, writable };
    this._outputStaticProperties.set(propName, { body: str, descriptor });
  }

  _analyzeMembers() {
    const handleSpecialOperations = member => {
      if (member.type === "operation") {
        if (member.special === "getter") {
          let msg = `Invalid getter ${member.name ? `"${member.name}" ` : ""}on interface ${this.name}`;
          if (member.definingInterface !== this.name) {
            msg += ` (defined in ${member.definingInterface})`;
          }
          msg += ": ";
          if (member.arguments.length !== 1) {
            throw new Error(msg + `1 argument should be present, found ${member.arguments.length}`);
          }
          if (isIndexed(member)) {
            if (this.indexedGetter) {
              throw new Error(msg + "duplicated indexed getter");
            }
            this.indexedGetter = member;
          } else if (isNamed(member)) {
            if (this.namedGetter) {
              throw new Error(msg + "duplicated named getter");
            }
            this.namedGetter = member;
          } else {
            throw new Error(msg + "getter is neither indexed nor named");
          }
        }
        if (member.special === "setter") {
          let msg = `Invalid setter ${member.name ? `"${member.name}" ` : ""}on interface ${this.name}`;
          if (member.definingInterface !== this.name) {
            msg += ` (defined in ${member.definingInterface})`;
          }
          msg += ": ";

          if (member.arguments.length !== 2) {
            throw new Error(msg + `2 arguments should be present, found ${member.arguments.length}`);
          }
          if (isIndexed(member)) {
            if (this.indexedSetter) {
              throw new Error(msg + "duplicated indexed setter");
            }
            this.indexedSetter = member;
            if (utils.hasCEReactions(member)) {
              this.needsPerGlobalProxyHandler = true;
            }
          } else if (isNamed(member)) {
            if (this.namedSetter) {
              throw new Error(msg + "duplicated named setter");
            }
            this.namedSetter = member;
            if (utils.hasCEReactions(member)) {
              this.needsPerGlobalProxyHandler = true;
            }
          } else {
            throw new Error(msg + "setter is neither indexed nor named");
          }
        }
        if (member.special === "deleter") {
          let msg = `Invalid deleter ${member.name ? `"${member.name}" ` : ""}on interface ${this.name}`;
          if (member.definingInterface !== this.name) {
            msg += ` (defined in ${member.definingInterface})`;
          }
          msg += ": ";

          if (member.arguments.length !== 1) {
            throw new Error(msg + `1 arguments should be present, found ${member.arguments.length}`);
          }
          if (isNamed(member)) {
            if (this.namedDeleter) {
              throw new Error(msg + "duplicated named deleter");
            }
            this.namedDeleter = member;
            if (utils.hasCEReactions(member)) {
              this.needsPerGlobalProxyHandler = true;
            }
          } else {
            throw new Error(msg + "deleter is not named");
          }
        }
      }
    };

    for (const member of this.members()) {
      let key;
      switch (member.type) {
        case "constructor":
          this.constructorOperations.push(member);
          break;
        case "operation":
          key = member.special === "static" ? "staticOperations" : "operations";
          if (member.name) {
            if (!this[key].has(member.name)) {
              this[key].set(member.name, new Operation(this.ctx, this, member));
            } else {
              this[key].get(member.name).idls.push(member);
            }
          }
          break;
        case "attribute":
          key = member.special === "static" ? "staticAttributes" : "attributes";
          this[key].set(member.name, new Attribute(this.ctx, this, member));
          break;
        case "const":
          this.constants.set(member.name, new Constant(this.ctx, this, member));
          break;
        case "iterable":
          if (this.iterable) {
            throw new Error(`Interface ${this.name} has more than one iterable declaration`);
          }
          this.iterable = new Iterable(this.ctx, this, member);
          break;
        default:
          if (!this.ctx.options.suppressErrors) {
            throw new Error(`Unknown IDL member type "${member.type}" in interface ${this.name}`);
          }
      }

      handleSpecialOperations(member);

      if (member.special === "stringifier") {
        let msg = `Invalid stringifier ${member.name ? `"${member.name}" ` : ""}on interface ${this.name}`;
        if (member.definingInterface !== this.name) {
          msg += ` (defined in ${member.definingInterface})`;
        }
        msg += ": ";
        if (member.type === "operation") {
          if (!member.idlType) {
            member.idlType = { idlType: "DOMString" };
          }
          if (!member.arguments) {
            member.arguments = [];
          }
          if (member.arguments.length > 0) {
            throw new Error(msg + "takes more than zero arguments");
          }
          if (member.idlType.idlType !== "DOMString" || member.idlType.nullable) {
            throw new Error(msg + "returns something other than a plain DOMString");
          }
          if (this.stringifier) {
            throw new Error(msg + "duplicated stringifier");
          }
          const op = new Operation(this.ctx, this, member);
          op.name = "toString";
          this.operations.set("toString", op);
        } else if (member.type === "attribute") {
          if (member.special === "static") {
            throw new Error(msg + "keyword cannot be placed on static attribute");
          }
          if (member.idlType.idlType !== "DOMString" && member.idlType.idlType !== "USVString" ||
              member.idlType.nullable) {
            throw new Error(msg + "attribute can only be of type DOMString or USVString");
          }
          // Implemented in Attribute class.
        } else {
          throw new Error(msg + `keyword placed on incompatible type ${member.type}`);
        }
        this.stringifier = member;
      }
    }
    for (const member of this.inheritedMembers()) {
      if (this.iterable && member.type === "iterable") {
        throw new Error(`Iterable interface ${this.name} inherits from another iterable interface ` +
                        `${member.definingInterface}`);
      }

      handleSpecialOperations(member);
    }

    // https://heycam.github.io/webidl/#dfn-reserved-identifier
    const forbiddenMembers = new Set(["constructor", "toString"]);
    if (this.iterable) {
      if (this.iterable.isValue) {
        if (!this.supportsIndexedProperties) {
          throw new Error(`A value iterator cannot be declared on ${this.name} which does not support indexed ` +
                          "properties");
        }
      } else if (this.iterable.isPair && this.supportsIndexedProperties) {
        throw new Error(`A pair iterator cannot be declared on ${this.name} which supports indexed properties`);
      }
      for (const n of ["entries", "forEach", "keys", "values"]) {
        forbiddenMembers.add(n);
      }
    }
    for (const member of this.allMembers()) {
      if (forbiddenMembers.has(member.name)) {
        let msg = `${member.name} is forbidden in interface ${this.name}`;
        if (member.definingInterface !== this.name) {
          msg += ` (defined in ${member.definingInterface})`;
        }
        throw new Error(msg);
      }
    }
  }

  get supportsIndexedProperties() {
    return this.indexedGetter !== null;
  }

  get supportsNamedProperties() {
    return this.namedGetter !== null;
  }

  get isLegacyPlatformObj() {
    return !this.isGlobal && (this.supportsIndexedProperties || this.supportsNamedProperties);
  }

  includes(source) {
    const mixin = this.ctx.interfaceMixins.get(source);
    if (!mixin) {
      if (this.ctx.options.suppressErrors) {
        return;
      }
      throw new Error(`${source} interface mixin not found (included in ${this.name})`);
    }

    this.included.push(source);
  }

  generateIterator() {
    if (this.iterable && this.iterable.isPair) {
      this.str += `
        const IteratorPrototype = Object.create(utils.IteratorPrototype, {
          next: {
            value: function next() {
              const internal = this[utils.iterInternalSymbol];
              const { target, kind, index } = internal;
              const values = Array.from(target[implSymbol]);
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
            value: "${this.name} Iterator",
            configurable: true
          }
        });
      `;
    }
  }

  // All interfaces an object of this interface implements.
  * allInterfaces(seen = new Set([this.name]), root = this.name) {
    yield this.name;
    if (this.idl.inheritance && this.ctx.interfaces.has(this.idl.inheritance)) {
      if (seen.has(this.idl.inheritance)) {
        throw new Error(`${root} has an inheritance cycle`);
      }
      seen.add(this.idl.inheritance);
      yield* this.ctx.interfaces.get(this.idl.inheritance).allInterfaces(seen, root);
    }
  }

  // Members that will be own properties of this interface's prototype object,
  // i.e. members from this interface and its mixins.
  * members() {
    yield* this.idl.members;
    for (const mixin of this.included) {
      yield* this.ctx.interfaceMixins.get(mixin).idl.members;
    }
  }

  // Members inherited from this interface's prototype chain.
  * inheritedMembers(seen = new Set([this.name]), root = this.name) {
    if (this.idl.inheritance && this.ctx.interfaces.has(this.idl.inheritance)) {
      if (seen.has(this.idl.inheritance)) {
        throw new Error(`${root} has an inheritance cycle`);
      }
      seen.add(this.idl.inheritance);
      yield* this.ctx.interfaces.get(this.idl.inheritance).allMembers(seen, root);
    }
  }

  * allMembers(seen = new Set([this.name]), root = this.name) {
    for (const mixin of this.included) {
      yield* this.ctx.interfaceMixins.get(mixin).idl.members;
    }
    for (const iface of this.allInterfaces(seen, root)) {
      yield* this.ctx.interfaces.get(iface).idl.members;
    }
  }

  generateRequires() {
    this.requires.addRaw(`{ implSymbol, ctorRegistrySymbol }`, "utils");

    if (this.idl.inheritance !== null) {
      this.requires.addRelative(this.idl.inheritance);
    }

    this.str = `
      ${this.requires.generate()}

      ${this.str}
    `;
  }

  generateExport() {
    this.str += `
      exports.is = function is(obj) {
        return utils.isObject(obj) && utils.hasOwn(obj, implSymbol) && obj[implSymbol] instanceof Impl.implementation;
      };
      exports.isImpl = function isImpl(obj) {
        return utils.isObject(obj) && obj instanceof Impl.implementation;
      };
      exports.convert = function convert(obj, { context = "The provided value" } = {}) {
        if (exports.is(obj)) {
          return utils.implForWrapper(obj);
        }
        throw new TypeError(\`\${context} is not of type '${this.name}'.\`);
      };
    `;

    if (this.iterable && this.iterable.isPair) {
      this.str += `
        exports.createDefaultIterator = function createDefaultIterator(target, kind) {
          const iterator = Object.create(IteratorPrototype);
          Object.defineProperty(iterator, utils.iterInternalSymbol, {
            value: { target, kind, index: 0 },
            configurable: true
          });
          return iterator;
        };
      `;
    }
  }

  generateLegacyProxyHandler() {
    const hasIndexedSetter = this.indexedSetter !== null;
    const hasNamedSetter = this.namedSetter !== null;
    const hasNamedDeleter = this.namedDeleter !== null;
    const overrideBuiltins = Boolean(utils.getExtAttr(this.idl.extAttrs, "OverrideBuiltins"));

    const supportsPropertyIndex = (O, index, indexedValue) => {
      let unsupportedValue = utils.getExtAttr(this.indexedGetter.extAttrs, "WebIDL2JSValueAsUnsupported");
      if (unsupportedValue) {
        unsupportedValue = unsupportedValue.rhs.value;
      }
      if (unsupportedValue) {
        const func = this.indexedGetter.name ? `.${this.indexedGetter.name}` : "[utils.indexedGet]";
        const value = indexedValue || `${O}[implSymbol]${func}(${index})`;
        return `${value} !== ${unsupportedValue}`;
      }
      return `${O}[implSymbol][utils.supportsPropertyIndex](${index})`;
    };

    const supportsPropertyName = (O, P, namedValue) => {
      let unsupportedValue = utils.getExtAttr(this.namedGetter.extAttrs, "WebIDL2JSValueAsUnsupported");
      if (unsupportedValue) {
        unsupportedValue = unsupportedValue.rhs.value;
      }
      if (unsupportedValue) {
        const func = this.namedGetter.name ? `.${this.namedGetter.name}` : "[utils.namedGet]";
        const value = namedValue || `${O}[implSymbol]${func}(${P})`;
        return `${value} !== ${unsupportedValue}`;
      }
      return `${O}[implSymbol][utils.supportsPropertyName](${P})`;
    };

    // "named property visibility algorithm"
    // If `supports` is true then skip the supportsPropertyName check.
    function namedPropertyVisible(P, O, supports = false) {
      const conditions = [];
      if (!supports) {
        conditions.push(supportsPropertyName(O, P));
      }
      if (overrideBuiltins) {
        conditions.push(`!utils.hasOwn(${O}, ${P})`);
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

      const prolog = `
        const index = ${P} >>> 0;
        let indexedValue = ${V};
        ${conv.body}
      `;

      let invocation;
      if (!this.indexedSetter.name) {
        invocation = `
          const creating = !(${supportsPropertyIndex(O, "index")});
          if (creating) {
            ${O}[implSymbol][utils.indexedSetNew](index, indexedValue);
          } else {
            ${O}[implSymbol][utils.indexedSetExisting](index, indexedValue);
          }
        `;
      } else {
        invocation = `
          ${O}[implSymbol].${this.indexedSetter.name}(index, indexedValue);
        `;
      }

      if (utils.hasCEReactions(this.indexedSetter)) {
        invocation = this.ctx.invokeProcessCEReactions(invocation, {
          requires: this.requires
        });
      }

      return prolog + invocation;
    };

    // "invoke a named property setter"
    const invokeNamedSetter = (O, P, V) => {
      const arg = this.namedSetter.arguments[1];
      const conv = Types.generateTypeConversion(
        this.ctx, "namedValue", arg.idlType, arg.extAttrs, this.name,
        `"Failed to set the '" + ${P} + "' property on '${this.name}': The provided value"`);
      this.requires.merge(conv.requires);

      const prolog = `
        let namedValue = ${V};
        ${conv.body}
      `;

      let invocation;
      if (!this.namedSetter.name) {
        invocation = `
          const creating = !(${supportsPropertyName(O, P)});
          if (creating) {
            ${O}[implSymbol][utils.namedSetNew](${P}, namedValue);
          } else {
            ${O}[implSymbol][utils.namedSetExisting](${P}, namedValue);
          }
        `;
      } else {
        invocation = `
          ${O}[implSymbol].${this.namedSetter.name}(${P}, namedValue);
        `;
      }

      if (utils.hasCEReactions(this.namedSetter)) {
        invocation = this.ctx.invokeProcessCEReactions(invocation, {
          requires: this.requires
        });
      }

      return prolog + invocation;
    };

    let sep = "";
    if (this.needsPerGlobalProxyHandler) {
      this.str += `
        const proxyHandlerCache = new WeakMap();
        class ProxyHandler {
          constructor(globalObject) {
            this._globalObject = globalObject;
          }
      `;
    } else {
      this.str += `
        const proxyHandler = {
      `;
      sep = ",";
    }

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
        }${sep}
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
        }${sep}
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
          for (const key of target[implSymbol][utils.supportedPropertyIndices]) {
            keys.add(\`\${key}\`);
          }
      `;
    }
    if (this.supportsNamedProperties) {
      this.str += `
          for (const key of target[implSymbol][utils.supportedPropertyNames]) {
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
        }${sep}
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

      const func = this.indexedGetter.name ? `.${this.indexedGetter.name}` : "[utils.indexedGet]";
      let preamble = "";
      let condition;
      if (utils.getExtAttr(this.indexedGetter.extAttrs, "WebIDL2JSValueAsUnsupported")) {
        this.str += `const indexedValue = target[implSymbol]${func}(index);`;
        condition = supportsPropertyIndex("target", "index", "indexedValue");
      } else {
        preamble = `const indexedValue = target[implSymbol]${func}(index);`;
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
      const func = this.namedGetter.name ? `.${this.namedGetter.name}` : "[utils.namedGet]";
      const enumerable = !utils.getExtAttr(this.idl.extAttrs, "LegacyUnenumerableNamedProperties");
      let preamble = "";
      const conditions = [];
      if (utils.getExtAttr(this.namedGetter.extAttrs, "WebIDL2JSValueAsUnsupported")) {
        this.str += `
          const namedValue = target[implSymbol]${func}(P);
        `;
        conditions.push(supportsPropertyName("target", "index", "namedValue"));
        conditions.push(namedPropertyVisible("P", "target", true));
      } else {
        preamble = `
          const namedValue = target[implSymbol]${func}(P);
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
        }${sep}
    `;

    // [[Set]]
    this.str += `
        set(target, P, V, receiver) {
          if (typeof P === "symbol") {
            return Reflect.set(target, P, V, receiver);
          }
          if (target === receiver) {
    `;

    if (this.needsPerGlobalProxyHandler) {
      this.str += `
          const globalObject = this._globalObject;
      `;
    }

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

      const func = this.indexedGetter.name ? `.${this.indexedGetter.name}` : "[utils.indexedGet]";
      let preamble = "";
      let condition;
      if (utils.getExtAttr(this.indexedGetter.extAttrs, "WebIDL2JSValueAsUnsupported")) {
        this.str += `const indexedValue = target[implSymbol]${func}(index);`;
        condition = supportsPropertyIndex("target", "index", "indexedValue");
      } else {
        preamble = `const indexedValue = target[implSymbol]${func}(index);`;
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
        }${sep}
    `;

    // [[DefineOwnProperty]]
    this.str += `
        defineProperty(target, P, desc) {
          if (typeof P === "symbol") {
            return Reflect.defineProperty(target, P, desc);
          }
    `;

    if (this.needsPerGlobalProxyHandler) {
      this.str += `
          const globalObject = this._globalObject;
      `;
    }

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
    if (this.supportsNamedProperties && !this.isGlobal) {
      const unforgeable = new Set();
      for (const m of this.allMembers()) {
        if ((m.type === "attribute" || m.type === "operation") && m.special !== "static" &&
            utils.getExtAttr(m.extAttrs, "Unforgeable")) {
          unforgeable.add(m.name);
        }
      }
      if (unforgeable.size > 0) {
        needFallback = true;
        this.str += `if (!${JSON.stringify([...unforgeable])}.includes(P)) {`;
      }
      if (!overrideBuiltins) {
        needFallback = true;
        this.str += "if (!utils.hasOwn(target, P)) {";
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
      if (unforgeable.size > 0) {
        this.str += "}";
      }
    } else {
      needFallback = true;
    }
    if (needFallback) {
      // Spec says to set configurable to true, but doing so will make Proxy's trap throw and also fail WPT.
      // if (!this.isGlobal) {
      //   this.str += `
      //     desc.configurable = true;
      //   `;
      // }
      this.str += `
          return Reflect.defineProperty(target, P, desc);
      `;
    }
    this.str += `
        }${sep}
    `;

    // [[Delete]]
    this.str += `
        deleteProperty(target, P) {
          if (typeof P === "symbol") {
            return Reflect.deleteProperty(target, P);
          }
    `;

    if (this.needsPerGlobalProxyHandler) {
      this.str += `
          const globalObject = this._globalObject;
      `;
    }

    if (this.supportsIndexedProperties) {
      this.str += `
          if (utils.isArrayIndexPropName(P)) {
            const index = P >>> 0;
            return !(${supportsPropertyIndex("target", "index")});
          }
      `;
    }
    if (this.supportsNamedProperties && !this.isGlobal) {
      this.str += `
          if (${namedPropertyVisible("P", "target")}) {
      `;
      if (!hasNamedDeleter) {
        this.str += `
            return false;
        `;
      } else {
        let invocation;
        const func = this.namedDeleter.name ? `.${this.namedDeleter.name}` : "[utils.namedDelete]";

        if (this.namedDeleter.idlType.idlType === "bool") {
          invocation = `
            return target[implSymbol]${func}(P);
          `;
        } else {
          invocation = `
            target[implSymbol]${func}(P);
            return true;
          `;
        }

        if (utils.hasCEReactions(this.namedDeleter)) {
          invocation = this.ctx.invokeProcessCEReactions(invocation, {
            requires: this.requires
          });
        }

        this.str += invocation;
      }
      this.str += `
          }
      `;
    }
    this.str += `
          return Reflect.deleteProperty(target, P);
        }${sep}
    `;

    // [[PreventExtensions]]
    this.str += `
        preventExtensions() {
          return false;
        }
    `;

    this.str += `
      };
    `;
  }

  generateIface() {
    this.str += `
      exports.create = function create(globalObject, constructorArgs, privateData) {
        if (globalObject[ctorRegistrySymbol] === undefined) {
          throw new Error('Internal error: invalid global object');
        }

        const ctor = globalObject[ctorRegistrySymbol]["${this.name}"];
        if (ctor === undefined) {
          throw new Error('Internal error: constructor ${this.name} is not installed on the passed global object');
        }

        let obj = Object.create(ctor.prototype);
        obj = exports.setup(obj, globalObject, constructorArgs, privateData);
        return obj;
      };
      exports.createImpl = function createImpl(globalObject, constructorArgs, privateData) {
        const obj = exports.create(globalObject, constructorArgs, privateData);
        return utils.implForWrapper(obj);
      };
      exports._internalSetup = function _internalSetup(obj, globalObject) {
    `;

    if (this.idl.inheritance) {
      this.str += `
        ${this.idl.inheritance}._internalSetup(obj, globalObject);
      `;
    }

    this.generateOnInstance();

    this.str += `
      };
      exports.setup = function setup(obj, globalObject, constructorArgs = [], privateData = {}) {
        privateData.wrapper = obj;

        exports._internalSetup(obj, globalObject);
        Object.defineProperty(obj, implSymbol, {
          value: new Impl.implementation(globalObject, constructorArgs, privateData),
          configurable: true
        });
    `;

    if (this.isLegacyPlatformObj) {
      if (this.needsPerGlobalProxyHandler) {
        this.str += `
        {
          let proxyHandler = proxyHandlerCache.get(globalObject);
          if (proxyHandler === undefined) {
            proxyHandler = new ProxyHandler(globalObject);
            proxyHandlerCache.set(globalObject, proxyHandler);
          }
          obj = new Proxy(obj, proxyHandler);
        }
        `;
      } else {
        this.str += `
        obj = new Proxy(obj, proxyHandler);
        `;
      }
    }

    this.str += `
        obj[implSymbol][utils.wrapperSymbol] = obj;
        if (Impl.init) {
          Impl.init(obj[implSymbol], privateData);
        }
        return obj;
      };
    `;
  }

  addConstructor() {
    const overloads = Overloads.getEffectiveOverloads("constructor", this.name, 0, this);

    let body;
    let argNames = [];

    if (overloads.length !== 0) {
      let minConstructor = overloads[0];
      for (let i = 1; i < overloads.length; ++i) {
        if (overloads[i].nameList.length < minConstructor.nameList.length) {
          minConstructor = overloads[i];
        }
      }
      argNames = minConstructor.nameList;

      const conversions = Parameters.generateOverloadConversions(
        this.ctx, "constructor", this.name, this, `Failed to construct '${this.name}': `);
      this.requires.merge(conversions.requires);

      const setupArgs = [
        "Object.create(new.target.prototype)",
        "globalObject",
        conversions.hasArgs ? "args" : "undefined"
      ];

      body = `
        ${conversions.body}
        return exports.setup(${formatArgs(setupArgs)});
      `;
    } else {
      body = `
        throw new TypeError("Illegal constructor");
      `;
    }

    if (utils.getExtAttr(this.idl.extAttrs, "HTMLConstructor")) {
      body = this.ctx.invokeProcessHTMLConstructor(body, {
        requires: this.requires
      });
    }

    this.addMethod("prototype", "constructor", argNames, body, "regular", { enumerable: false });
  }

  get defaultWhence() {
    return this.isGlobal ? "instance" : "prototype";
  }

  addIteratorMethod() {
    // TODO maplike setlike
    // Don't bother checking "length" attribute as interfaces that support indexed properties must implement one.
    // "Has value iterator" implies "supports indexed properties".
    if (this.supportsIndexedProperties) {
      this.addProperty(this.defaultWhence, Symbol.iterator, "Array.prototype[Symbol.iterator]");
    }
  }

  addAllMethodsProperties() {
    this.addConstructor();

    this.addProperty("prototype", Symbol.toStringTag, JSON.stringify(this.name), {
      writable: false
    });

    const unscopables = Object.create(null);
    for (const member of this.members()) {
      if (utils.getExtAttr(member.extAttrs, "Unscopable")) {
        unscopables[member.name] = true;
      }
    }
    if (Object.keys(unscopables).length > 0) {
      // eslint-disable-next-line no-proto
      unscopables.__proto__ = null;
      this.addProperty("prototype", Symbol.unscopables, JSON.stringify(unscopables), {
        writable: false
      });
    }

    for (const member of [...this.operations.values(), ...this.staticOperations.values()]) {
      const data = member.generate();
      this.requires.merge(data.requires);
    }
    this.addIteratorMethod();
    if (this.iterable) {
      const data = this.iterable.generate();
      this.requires.merge(data.requires);
    }

    for (const member of [...this.attributes.values(), ...this.staticAttributes.values(), ...this.constants.values()]) {
      const data = member.generate();
      this.requires.merge(data.requires);
    }
  }

  generateOffInstanceMethods() {
    const addOne = (name, args, body) => {
      this.str += `
        ${name}(${formatArgs(args)}) {${body}}
      `;
    };

    for (const [name, { whence, type, args, body }] of this._outputMethods) {
      if (whence !== "prototype") {
        continue;
      }

      const propName = utils.stringifyPropertyKey(name);
      if (type === "regular") {
        addOne(propName, args, body);
      } else {
        if (body[0] !== undefined) {
          addOne(`get ${propName}`, [], body[0]);
        }
        if (body[1] !== undefined) {
          addOne(`set ${propName}`, args, body[1]);
        }
      }
    }

    for (const [name, { type, args, body }] of this._outputStaticMethods) {
      const propName = utils.stringifyPropertyKey(name);
      if (type === "regular") {
        addOne(`static ${propName}`, args, body);
      } else {
        if (body[0] !== undefined) {
          addOne(`static get ${propName}`, [], body[0]);
        }
        if (body[1] !== undefined) {
          addOne(`static set ${propName}`, args, body[0]);
        }
      }
    }
  }

  generateOffInstanceAfterClass() {
    // Inheritance is taken care of by "extends" clause in class declaration.
    if (utils.getExtAttr(this.idl.extAttrs, "LegacyArrayClass")) {
      if (this.idl.inheritance) {
        throw new Error(`Interface ${this.name} has [LegacyArrayClass] but inherits from ${this.idl.inheritance}`);
      }
      this.str += `
        Object.setPrototypeOf(${this.name}.prototype, Array.prototype);
      `;
    }

    const protoProps = new Map();
    const classProps = new Map();

    for (const [name, { whence, type, descriptor }] of this._outputMethods) {
      if (whence !== "prototype") {
        continue;
      }

      const descriptorModifier = getPropertyDescriptorModifier(defaultClassMethodDescriptor, descriptor, type);
      if (descriptorModifier === undefined) {
        continue;
      }
      protoProps.set(utils.stringifyPropertyKey(name), descriptorModifier);
    }

    for (const [name, { type, descriptor }] of this._outputStaticMethods) {
      const descriptorModifier = getPropertyDescriptorModifier(defaultClassMethodDescriptor, descriptor, type);
      if (descriptorModifier === undefined) {
        continue;
      }
      classProps.set(utils.stringifyPropertyKey(name), descriptorModifier);
    }

    for (const [name, { whence, body, descriptor }] of this._outputProperties) {
      if (whence !== "prototype") {
        continue;
      }

      const descriptorModifier =
        getPropertyDescriptorModifier(defaultDefinePropertyDescriptor, descriptor, "regular", body);
      protoProps.set(utils.stringifyPropertyKey(name), descriptorModifier);
    }

    for (const [name, { body, descriptor }] of this._outputStaticProperties) {
      const descriptorModifier =
        getPropertyDescriptorModifier(defaultDefinePropertyDescriptor, descriptor, "regular", body);
      classProps.set(utils.stringifyPropertyKey(name), descriptorModifier);
    }

    if (protoProps.size > 0) {
      const props = [...protoProps].map(([name, body]) => `${name}: ${body}`);
      this.str += `Object.defineProperties(${this.name}.prototype, { ${props.join(", ")} });`;
    }

    if (classProps.size > 0) {
      const props = [...classProps].map(([name, body]) => `${name}: ${body}`);
      this.str += `Object.defineProperties(${this.name}, { ${props.join(", ")} });`;
    }
  }

  generateOnInstance() {
    const methods = [];
    const props = new Map();

    function addOne(name, args, body) {
      methods.push(`
        ${name}(${formatArgs(args)}) {${body}}
      `);
    }

    for (const [name, { whence, type, args, body, descriptor }] of this._outputMethods) {
      if (whence !== "instance") {
        continue;
      }

      const propName = utils.stringifyPropertyKey(name);
      if (type === "regular") {
        addOne(propName, args, body);
      } else {
        if (body[0] !== undefined) {
          addOne(`get ${propName}`, [], body[0]);
        }
        if (body[1] !== undefined) {
          addOne(`set ${propName}`, args, body[1]);
        }
      }

      const descriptorModifier = getPropertyDescriptorModifier(defaultObjectLiteralDescriptor, descriptor, type);
      if (descriptorModifier === undefined) {
        continue;
      }
      props.set(utils.stringifyPropertyKey(name), descriptorModifier);
    }

    for (const [name, { whence, body, descriptor }] of this._outputProperties) {
      if (whence !== "instance") {
        continue;
      }

      const propName = utils.stringifyPropertyKey(name);
      methods.push(`${propName}: ${body}`);

      const descriptorModifier = getPropertyDescriptorModifier(defaultObjectLiteralDescriptor, descriptor, "regular");
      if (descriptorModifier === undefined) {
        continue;
      }
      props.set(propName, descriptorModifier);
    }

    const propStrs = [...props].map(([name, body]) => `${name}: ${body}`);
    if (methods.length > 0) {
      this.str += `
        Object.defineProperties(
          obj,
          Object.getOwnPropertyDescriptors({ ${methods.join(", ")} })
        );
      `;
    }
    if (propStrs.length > 0) {
      this.str += `
        Object.defineProperties(
          obj,
          { ${propStrs.join(", ")} }
        );
      `;
    }
  }

  generateInstall() {
    const { idl, name } = this;

    this.str += `
      exports.install = function install(globalObject) {
    `;

    if (idl.inheritance) {
      this.str += `
        if (globalObject.${idl.inheritance} === undefined) {
          throw new Error('Internal error: attempting to evaluate ${name} before ${idl.inheritance}');
        }
      `;
    }

    const ext = idl.inheritance ? ` extends globalObject.${idl.inheritance}` : "";

    this.str += `class ${name}${ext} {`;
    this.generateOffInstanceMethods();
    this.str += "}";

    this.generateOffInstanceAfterClass();

    this.str += `
        if (globalObject[ctorRegistrySymbol] === undefined) {
          globalObject[ctorRegistrySymbol] = Object.create(null);
        }
        globalObject[ctorRegistrySymbol][interfaceName] = ${name};

        Object.defineProperty(globalObject, interfaceName, {
          configurable: true,
          writable: true,
          value: ${name}
        });
      };
    `;
  }

  generate() {
    this.str += `
      const interfaceName = "${this.name}";
    `;
    this.generateIterator();

    this.generateExport();
    this.generateIface();
    this.generateInstall();
    if (this.isLegacyPlatformObj) {
      this.generateLegacyProxyHandler();
    }

    this.generateRequires();
  }

  toString() {
    this.str = "";
    if (!this._analyzed) {
      this._analyzed = true;
      this._analyzeMembers();
    }
    this.addAllMethodsProperties();
    this.generate();
    return this.str;
  }
}

Interface.prototype.type = "interface";

module.exports = Interface;
