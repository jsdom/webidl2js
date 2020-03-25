"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const Types = require("../types");

class Attribute {
  constructor(ctx, I, idl) {
    this.ctx = ctx;
    this.interface = I;
    this.idl = idl;
    this.static = idl.special === "static";
  }

  generate() {
    const requires = new utils.RequiresMap(this.ctx);

    const configurable = !utils.getExtAttr(this.idl.extAttrs, "Unforgeable");
    const shouldReflect =
      this.idl.extAttrs.some(attr => attr.name.startsWith("Reflect")) && this.ctx.processReflect !== null;
    const sameObject = utils.getExtAttr(this.idl.extAttrs, "SameObject");

    const onInstance = utils.isOnInstance(this.idl, this.interface.idl);

    let brandCheck = `
      if (!exports.is(esValue)) {
        throw new TypeError("Illegal invocation");
      }
    `;
    let getterBody = `return utils.tryWrapperForImpl(esValue[implSymbol]["${this.idl.name}"]);`;
    let setterBody = `esValue[implSymbol]["${this.idl.name}"] = V;`;
    if (conversions[this.idl.idlType.idlType]) {
      getterBody = `return esValue[implSymbol]["${this.idl.name}"];`;
    }

    const addMethod = this.static ?
      this.interface.addStaticMethod.bind(this.interface) :
      this.interface.addMethod.bind(this.interface, onInstance ? "instance" : "prototype");

    if (this.static) {
      brandCheck = "";
      getterBody = `return Impl.implementation["${this.idl.name}"];`;
      setterBody = `Impl.implementation["${this.idl.name}"] = V;`;
    } else if (shouldReflect) {
      const processedOutput = this.ctx.invokeProcessReflect(this.idl, "esValue[implSymbol]", { requires });
      getterBody = processedOutput.get;
      setterBody = processedOutput.set;
    }

    if (utils.getExtAttr(this.idl.extAttrs, "LenientThis")) {
      brandCheck = "";
    }

    if (sameObject) {
      getterBody = `return utils.getSameObject(this, "${this.idl.name}", () => { ${getterBody} });`;
    }

    if (utils.hasCEReactions(this.idl)) {
      const processorConfig = { requires };

      getterBody = this.ctx.invokeProcessCEReactions(getterBody, processorConfig);
      setterBody = this.ctx.invokeProcessCEReactions(setterBody, processorConfig);
    }

    addMethod(this.idl.name, [], `
      const esValue = this !== null && this !== undefined ? this : globalObject;
      ${brandCheck}
      ${getterBody}
    `, "get", { configurable });

    if (!this.idl.readonly) {
      let idlConversion;
      if (typeof this.idl.idlType.idlType === "string" && !this.idl.idlType.nullable &&
          this.ctx.enumerations.has(this.idl.idlType.idlType)) {
        requires.addRelative(this.idl.idlType.idlType);
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
        const esValue = this !== null && this !== undefined ? this : globalObject;
        ${brandCheck}
        ${idlConversion}
        ${setterBody}
      `, "set", { configurable });
    } else if (utils.getExtAttr(this.idl.extAttrs, "PutForwards")) {
      addMethod(this.idl.name, ["V"], `
        const esValue = this !== null && this !== undefined ? this : globalObject;
        ${brandCheck}
        this.${this.idl.name}.${utils.getExtAttr(this.idl.extAttrs, "PutForwards").rhs.value} = V;
      `, "set", { configurable });
    } else if (utils.getExtAttr(this.idl.extAttrs, "Replaceable")) {
      addMethod(this.idl.name, ["V"], `
        const esValue = this !== null && this !== undefined ? this : globalObject;
        ${brandCheck}
        Object.defineProperty(esValue, "${this.idl.name}", {
          configurable: true,
          enumerable: true,
          value: V,
          writable: true
        });
      `, "set", { configurable });
    }

    if (!this.static && this.idl.special === "stringifier") {
      addMethod("toString", [], `
        const esValue = this;
        if (!exports.is(esValue)) {
          throw new TypeError("Illegal invocation");
        }

        ${getterBody}
      `, "regular", { configurable, writable: configurable });
    }

    return { requires };
  }
}

module.exports = Attribute;
