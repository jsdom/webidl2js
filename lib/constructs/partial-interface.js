"use strict";

const Interface = require("./interface");
const utils = require("../utils");

class PartialInterface extends Interface {
  constructor(ctx, idl, opts) {
    super(ctx, idl, opts);

    for (const attr of idl.extAttrs) {
      if (attr.name !== "Exposed") {
        throw new Error(`[${attr.name}] is not supported on external partial interface ${this.name}`);
      }
    }

    const members = new Map();
    for (const member of idl.members) {
      if ((member.type !== "operation" && member.type !== "attribute") || member.special !== "static") {
        throw new Error(`External partial interface ${this.name} supports only static operations and attributes`);
      }
      const previous = members.get(member.name);
      if (previous && (previous.type !== "operation" || member.type !== "operation")) {
        throw new Error(`Duplicate member ${member.name} on external partial interface ${this.name}`);
      }
      members.set(member.name, member);

      for (const attr of member.extAttrs) {
        if (attr.name !== "CEReactions" &&
            !(member.type === "operation" && attr.name === "WebIDL2JSCallWithGlobal")) {
          throw new Error(`[${attr.name}] is not supported on external partial member ${this.name}.${member.name}`);
        }
      }
    }
  }

  * allMembers() {
    yield* this.idl.members;
  }

  addAllMethodsProperties() {
    for (const member of [...this.staticOperations.values(), ...this.staticAttributes.values()]) {
      this.requires.merge(member.generate().requires);
    }
  }

  generate() {
    const methods = [];
    for (const [name, { type, args, body }] of this._outputStaticMethods) {
      const key = utils.stringifyPropertyKey(name);
      if (type === "regular") {
        methods.push(`${key}(${utils.formatArgs(args)}) { ${body} }`);
      } else {
        if (body[0] !== undefined) {
          methods.push(`get ${key}() { ${body[0]} }`);
        }
        if (body[1] !== undefined) {
          methods.push(`set ${key}(${utils.formatArgs(args)}) { ${body[1]} }`);
        }
      }
    }

    // Each partial has its own exposure set and implementation module. The containing module combines installers.
    this.str = `
      const interfaceName = ${JSON.stringify(this.name)};
      const exposed = new Set(${JSON.stringify([...this.exposed])});
      ${this.requires.generate()}

      return (globalObject, globalNames) => {
        if (!globalNames.some(globalName => exposed.has(globalName))) {
          return;
        }
        const target = globalObject[interfaceName];
        if (typeof target !== "function") {
          throw new globalObject.TypeError(interfaceName + " must be installed before its partial interfaces");
        }
        const additions = { ${methods.join(",")} };
        for (const name of Reflect.ownKeys(additions)) {
          if (Object.hasOwn(target, name)) {
            throw new globalObject.TypeError(interfaceName + " already has a member named " + name);
          }
        }
        utils.define(target, additions);
      };
    `;
  }
}

module.exports = PartialInterface;
