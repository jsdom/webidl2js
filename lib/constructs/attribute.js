"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const reflector = require("../reflector");
const Types = require("../types");

class Attribute {
  constructor(ctx, I, idl) {
    this.ctx = ctx;
    this.interface = I;
    this.idl = idl;
    this.static = idl.static;
  }

  generate() {
    const requires = new utils.RequiresMap(this.ctx);

    const configurable = !utils.getExtAttr(this.idl.extAttrs, "Unforgeable");
    const shouldReflect = utils.getExtAttr(this.idl.extAttrs, "Reflect");
    const sameObject = utils.getExtAttr(this.idl.extAttrs, "SameObject");

    const onInstance = utils.isOnInstance(this.idl, this.interface.idl);

    let objName = `this`;
    if (onInstance) { // we're in a setup method
      objName = `obj`;
    }
    let brandCheck = `
      if (!this || !module.exports.is(this)) {
        throw new TypeError("Illegal invocation");
      }
    `;
    let getterBody = `return utils.tryWrapperForImpl(${objName}[impl]["${this.idl.name}"]);`;
    let setterBody = `${objName}[impl]["${this.idl.name}"] = V;`;
    if (conversions[this.idl.idlType.idlType]) {
      getterBody = `return ${objName}[impl]["${this.idl.name}"];`;
    }

    const addMethod = this.static ?
      this.interface.addStaticMethod.bind(this.interface) :
      this.interface.addMethod.bind(this.interface, onInstance ? "instance" : "prototype");

    if (this.static) {
      brandCheck = "";
      getterBody = `return Impl.implementation["${this.idl.name}"];`;
      setterBody = `Impl.implementation["${this.idl.name}"] = V;`;
    } else if (shouldReflect) {
      if (!reflector[this.idl.idlType.idlType]) {
        throw new Error("Unknown reflector type: " + this.idl.idlType.idlType);
      }
      const attrName = shouldReflect.rhs && shouldReflect.rhs.value.replace(/_/g, "-") || this.idl.name;
      getterBody = reflector[this.idl.idlType.idlType].get(objName, attrName.toLowerCase());
      setterBody = reflector[this.idl.idlType.idlType].set(objName, attrName.toLowerCase());
    }

    if (utils.getExtAttr(this.idl.extAttrs, "LenientThis")) {
      brandCheck = "";
    }

    if (sameObject) {
      getterBody = `return utils.getSameObject(this, "${this.idl.name}", () => { ${getterBody} });`;
    }

    addMethod(this.idl.name, [], `
      ${brandCheck}
      ${getterBody}
    `, "get", { configurable });

    if (!this.idl.readonly) {
      let idlConversion;
      if (typeof this.idl.idlType.idlType === "string" && !this.idl.idlType.nullable &&
          this.ctx.enumerations.has(this.idl.idlType.idlType)) {
        requires.add(this.idl.idlType.idlType);
        idlConversion = `
          V = \`\${V}\`;
          if (!${this.idl.idlType.idlType}.enumerationValues.has(V)) {
            return;
          }
        `;
      } else {
        const conv = Types.generateTypeConversion(
          this.ctx, "V", this.idl.idlType, this.idl.extAttrs, this.interface.name,
          `"Failed to set the '${this.idl.name}' property on '${this.interface.name}': The provided value"`);
        requires.merge(conv.requires);
        idlConversion = conv.body;
      }

      addMethod(this.idl.name, ["V"], `
        ${brandCheck}
        ${idlConversion}
        ${setterBody}
      `, "set", { configurable });
    } else if (utils.getExtAttr(this.idl.extAttrs, "PutForwards")) {
      addMethod(this.idl.name, ["V"], `
        ${brandCheck}
        this.${this.idl.name}.${utils.getExtAttr(this.idl.extAttrs, "PutForwards").rhs.value} = V;
      `, "set", { configurable });
    } else if (utils.getExtAttr(this.idl.extAttrs, "Replaceable")) {
      addMethod(this.idl.name, ["V"], `
        ${brandCheck}
        Object.defineProperty(this, "${this.idl.name}", {
          configurable: true,
          enumerable: true,
          value: V,
          writable: true
        });
      `, "set", { configurable });
    }

    if (!this.static && this.idl.stringifier) {
      addMethod("toString", [], `
        if (!this || !module.exports.is(this)) {
          throw new TypeError("Illegal invocation");
        }
        ${getterBody};
      `, "regular", { configurable, writable: configurable });
    }

    return { requires };
  }
}

module.exports = Attribute;
