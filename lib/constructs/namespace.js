"use strict";

const utils = require("../utils");
const Attribute = require("./attribute");
const Constant = require("./constant");
const Operation = require("./operation");

const defaultObjectLiteralDescriptor = {
  configurable: true,
  enumerable: true,
  writable: true
};

class Namespace {
  constructor(ctx, idl, opts) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;
    this.opts = opts;

    this.str = null;
    this.requires = new utils.RequiresMap(ctx);

    this.operations = new Map();
    this.attributes = new Map();
    this.constants = new Map();

    this._analyzed = false;
    this._outputStaticMethods = new Map();
    this._outputStaticProperties = new Map();

    const exposed = utils.getExtAttr(this.idl.extAttrs, "Exposed");
    if (!exposed) {
      throw new Error(`Namespace ${this.name} lacks [Exposed]`);
    }

    if (!exposed.rhs || (exposed.rhs.type !== "identifier" && exposed.rhs.type !== "identifier-list")) {
      throw new Error(`[Exposed] must take an identifier or an identifier list in namespace ${this.name}`);
    }

    if (exposed.rhs.type === "identifier") {
      this.exposed = new Set([exposed.rhs.value]);
    } else {
      this.exposed = new Set(exposed.rhs.value.map(token => token.value));
    }
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

  addStaticProperty(propName, str, {
    configurable = true,
    enumerable = typeof propName === "string",
    writable = true
  } = {}) {
    const descriptor = { configurable, enumerable, writable };
    this._outputStaticProperties.set(propName, { body: str, descriptor });
  }

  _analyzeMembers() {
    for (const member of this.idl.members) {
      switch (member.type) {
        case "operation":
          if (!member.name) {
            if (!this.ctx.options.suppressErrors) {
              throw new Error(`Unnamed operation in namespace ${this.name}`);
            }
            break;
          }
          if (!this.operations.has(member.name)) {
            this.operations.set(member.name, new Operation(this.ctx, this, member));
          } else {
            this.operations.get(member.name).idls.push(member);
          }
          break;
        case "attribute":
          if (!member.readonly) {
            if (!this.ctx.options.suppressErrors) {
              throw new Error(`Namespace attribute "${member.name}" on ${this.name} must be readonly`);
            }
            break;
          }
          this.attributes.set(member.name, new Attribute(this.ctx, this, member));
          break;
        case "const":
          this.constants.set(member.name, new Constant(this.ctx, this, member));
          break;
        default:
          if (!this.ctx.options.suppressErrors) {
            throw new Error(`Unknown IDL member type "${member.type}" in namespace ${this.name}`);
          }
      }
    }
  }

  addAllMethodsProperties() {
    this.addStaticProperty(Symbol.toStringTag, JSON.stringify(this.name), {
      writable: false
    });

    for (const member of this.operations.values()) {
      const data = member.generate();
      this.requires.merge(data.requires);
    }

    for (const member of [...this.attributes.values(), ...this.constants.values()]) {
      const data = member.generate();
      this.requires.merge(data.requires);
    }
  }

  generateNamespaceObject() {
    const members = [];
    const props = new Map();

    function addOne(name, args, body) {
      members.push(`
        ${name}(${utils.formatArgs(args)}) {${body}}
      `);
    }

    for (const [name, { type, args, body, descriptor }] of this._outputStaticMethods) {
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

      const descriptorModifier = utils.getPropertyDescriptorModifier(defaultObjectLiteralDescriptor, descriptor, type);
      if (descriptorModifier === undefined) {
        continue;
      }
      props.set(propName, descriptorModifier);
    }

    for (const [name, { body, descriptor }] of this._outputStaticProperties) {
      const descriptorModifier =
        utils.getPropertyDescriptorModifier(utils.defaultDefinePropertyDescriptor, descriptor, "regular", body);
      props.set(utils.stringifyPropertyKey(name), descriptorModifier);
    }

    const propStrs = [...props].map(([name, body]) => `${name}: ${body}`);

    this.str += `
      const namespaceObject = Object.create(globalObject.Object.prototype);
    `;
    if (members.length > 0) {
      this.str += `
        utils.define(namespaceObject, {
          ${members.join(", ")}
        });
      `;
    }
    if (propStrs.length > 0) {
      this.str += `
        Object.defineProperties(namespaceObject, {
          ${propStrs.join(", ")}
        });
      `;
    }
  }

  generateInstall() {
    this.str += `
      const namespaceName = "${this.name}";
      const exposed = new Set(${JSON.stringify([...this.exposed])});

      exports.install = (globalObject, globalNames) => {
        if (!globalNames.some(globalName => exposed.has(globalName))) {
          return;
        }
    `;

    this.generateNamespaceObject();

    this.str += `
        Object.defineProperty(globalObject, namespaceName, {
          configurable: true,
          writable: true,
          value: namespaceObject
        });
      };
    `;
  }

  generateRequires() {
    this.str = `
      ${this.requires.generate()}

      ${this.str}
    `;
  }

  generate() {
    this.generateInstall();
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

Namespace.prototype.type = "namespace";

module.exports = Namespace;
