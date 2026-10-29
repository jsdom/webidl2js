"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const Overloads = require("../overloads");
const Parameters = require("../parameters");
const Types = require("../types");
const Attribute = require("./attribute");

class Operation {
  constructor(ctx, I, idl) {
    this.ctx = ctx;
    this.interface = I;
    this.idls = [idl];
    this.name = idl.name;
    this.static = idl.special === "static";
    this.namespace = I.type === "namespace";
  }

  getWhence() {
    const { idls } = this;
    const firstOverloadOnInstance = utils.isOnInstance(idls[0], this.interface.idl);
    const hasLegacyUnforgeable = Boolean(utils.getExtAttr(idls[0].extAttrs, "LegacyUnforgeable"));

    for (let i = 1; i < idls.length; i++) {
      if (
        Boolean(utils.getExtAttr(idls[i].extAttrs, "LegacyUnforgeable")) !== hasLegacyUnforgeable
      ) {
        throw new Error(
          `[LegacyUnforgeable] is not applied uniformly to operation "${this.name}" on ${this.interface.name}`,
        );
      }
    }

    if (hasLegacyUnforgeable) {
      return "unforgeables";
    }

    return firstOverloadOnInstance ? "instance" : "prototype";
  }

  isAsync() {
    // As of the time of this writing, the current spec does not disallow such overloads, but the intention is to do so:
    // https://github.com/heycam/webidl/pull/776
    const firstAsync = this.idls[0].idlType.generic === "Promise";
    for (const overload of this.idls.slice(1)) {
      const isAsync = overload.idlType.generic === "Promise";
      if (isAsync !== firstAsync) {
        throw new Error(
          `Overloading between Promise and non-Promise return types is not allowed: operation "${this.name}" on ${this.interface.name}`,
        );
      }
    }
    return firstAsync;
  }

  hasCallWithGlobal() {
    const { idls } = this;
    const hasCallWithGlobal = Boolean(
      utils.getExtAttr(idls[0].extAttrs, "WebIDL2JSCallWithGlobal"),
    );

    if (hasCallWithGlobal && !this.static && !this.namespace) {
      throw new Error(
        `[WebIDL2JSCallWithGlobal] is only valid for static or namespace operations: "${this.name}" on ${this.interface.name}`,
      );
    }

    for (let i = 1; i < idls.length; i++) {
      if (
        hasCallWithGlobal !== Boolean(utils.getExtAttr(idls[i].extAttrs, "WebIDL2JSCallWithGlobal"))
      ) {
        throw new Error(
          `[WebIDL2JSCallWithGlobal] is not applied uniformly to operation "${this.name}" on ${this.interface.name}`,
        );
      }
    }

    return hasCallWithGlobal;
  }

  generateDefaultToJSON(requires) {
    const attributes = [];
    for (const name of [...this.interface.allInterfaces()].reverse()) {
      const iface = this.ctx.interfaces.get(name);
      const members = [...iface.members()];
      if (
        !members.some(
          (member) =>
            member.type === "operation" &&
            member.name === "toJSON" &&
            utils.getExtAttr(member.extAttrs, "Default"),
        )
      ) {
        continue;
      }
      for (const member of members) {
        if (member.type === "attribute" && member.special !== "static") {
          attributes.push(new Attribute(this.ctx, iface, member));
        }
      }
    }

    const properties = [];
    for (const attribute of attributes) {
      const member = attribute.idl;
      // Browser bindings filter by IDL type before invoking any getter steps.
      // Spec fix: https://github.com/whatwg/webidl/pull/1657
      if (!Types.isJSONType(this.ctx, member.idlType)) {
        continue;
      }
      const getter = attribute.generateGetter(requires);
      // Reflection hooks provide statement bodies; ordinary getters can be inlined as expressions.
      const expression = getter.getExpression ?? `(() => { ${getter.get} })()`;
      const property = `${utils.stringifyPropertyKey(member.name)}: ${expression}`;
      const exposed = utils.getExtAttr(member.extAttrs, "Exposed");
      if (exposed) {
        const names =
          exposed.rhs.type === "identifier"
            ? [exposed.rhs.value]
            : exposed.rhs.value.map((token) => token.value);
        const condition = names
          .map((name) => `globalNames.includes(${JSON.stringify(name)})`)
          .join(" || ");
        properties.push(`...(${condition} ? { ${property} } : {})`);
      } else {
        properties.push(property);
      }
    }
    return `return utils.newObjectInRealm(globalObject, { ${properties.join(",")} });`;
  }

  generate() {
    const requires = new utils.RequiresMap(this.ctx);

    if (this.idls.some((idl) => utils.getExtAttr(idl.extAttrs, "Default"))) {
      const idl = this.idls[0];
      const type = Types.resolveType(this.ctx, idl.idlType);
      const attr = utils.getExtAttr(idl.extAttrs, "Default");
      if (
        this.namespace ||
        idl.special ||
        this.name !== "toJSON" ||
        this.idls.length !== 1 ||
        idl.arguments.length !== 0 ||
        type.idlType !== "object" ||
        type.nullable ||
        !attr ||
        attr.rhs ||
        attr.arguments.length !== 0
      ) {
        throw new Error(
          `[Default] requires a regular, non-overloaded object toJSON() operation on ${this.interface.name}`,
        );
      }
    }

    let str = "";

    if (!this.name) {
      throw new Error(
        `Internal error: this operation does not have a name (in interface ${this.interface.name})`,
      );
    }

    const whence = this.namespace ? null : this.getWhence();
    const async = this.isAsync();
    const promiseHandlingBefore = async ? `try {` : ``;
    const promiseHandlingAfter = async
      ? `} catch (e) { return globalObject.Promise.reject(e); }`
      : ``;
    const hasCallWithGlobal = this.hasCallWithGlobal();

    const type = this.static ? "static operation" : "regular operation";
    const overloads = Overloads.getEffectiveOverloads(type, this.name, 0, this.interface);
    let minOp = overloads[0];
    for (let i = 1; i < overloads.length; ++i) {
      if (overloads[i].nameList.length < minOp.nameList.length) {
        minOp = overloads[i];
      }
    }

    const argNames = minOp.nameList;

    if (!this.static && !this.namespace) {
      str += this.interface.generateBrandCheck(this.name);
    }

    const callOn = this.static || this.namespace ? "Impl.implementation" : "$impl";
    // In case of stringifiers, use the named implementation function rather than hardcoded "toString".
    // All overloads will have the same name, so pick the first one.
    const implFunc = this.idls[0].name || this.name;

    const parameterConversions = Parameters.generateOverloadConversions(
      this.ctx,
      type,
      this.name,
      this.interface,
      `Failed to execute '${this.name}' on '${this.interface.name}': `,
    );
    const args = [];
    requires.merge(parameterConversions.requires);
    str += parameterConversions.body;

    if (hasCallWithGlobal) {
      args.push("globalObject");
    }

    if (parameterConversions.hasArgs) {
      args.push("...args");
    }

    let invocation;
    if (this.name === "toJSON" && utils.getExtAttr(this.idls[0].extAttrs, "Default")) {
      invocation = this.generateDefaultToJSON(requires);
    } else if (overloads.every((overload) => conversions[overload.operation.idlType.idlType])) {
      invocation = `
        return ${callOn}.${implFunc}(${utils.formatArgs(args)});
      `;
    } else {
      invocation = `
        return utils.tryWrapperForImpl(${callOn}.${implFunc}(${utils.formatArgs(args)}));
      `;
    }

    if (utils.hasCEReactions(this.idls[0])) {
      invocation = this.ctx.invokeProcessCEReactions(invocation, {
        requires,
      });
    }
    str += invocation;

    str = promiseHandlingBefore + str + promiseHandlingAfter;

    if (this.static || this.namespace) {
      this.interface.addStaticMethod(this.name, argNames, str);
    } else {
      const forgeable = whence !== "unforgeables";
      this.interface.addMethod(whence, this.name, argNames, str, "regular", {
        configurable: forgeable,
        writable: forgeable,
      });
    }

    return { requires };
  }
}

module.exports = Operation;
