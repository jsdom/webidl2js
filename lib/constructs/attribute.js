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

  getWhence() {
    const { idl } = this;
    const isOnInstance = utils.isOnInstance(idl, this.interface.idl);

    if (utils.getExtAttr(idl.extAttrs, "LegacyUnforgeable")) {
      return "unforgeables";
    }

    return isOnInstance ? "instance" : "prototype";
  }

  generate() {
    const requires = new utils.RequiresMap(this.ctx);

    const whence = this.getWhence();
    const configurable = whence !== "unforgeables";
    const shouldReflect =
      this.idl.extAttrs.some(attr => attr.name.startsWith("Reflect")) && this.ctx.processReflect !== null;
    const sameObject = utils.getExtAttr(this.idl.extAttrs, "SameObject");

    const async = this.idl.idlType.generic === "Promise";
    const promiseHandlingBefore = async ? `try {` : ``;
    const promiseHandlingAfter = async ? `} catch (e) { return globalObject.Promise.reject(e); }` : ``;

    let brandCheck = `
      if (!exports.is(esValue)) {
        throw new globalObject.TypeError("'$KEYWORD$ ${this.idl.name}' called on an object that is not a valid instance of ${this.interface.name}.");
      }
    `;
    let getterBody = `return utils.tryWrapperForImpl(esValue[implSymbol]["${this.idl.name}"]);`;
    let setterBody = `esValue[implSymbol]["${this.idl.name}"] = V;`;
    if (conversions[this.idl.idlType.idlType]) {
      getterBody = `return esValue[implSymbol]["${this.idl.name}"];`;
    }

    const addMethod = this.static ?
      this.interface.addStaticMethod.bind(this.interface) :
      this.interface.addMethod.bind(this.interface, whence);

    if (this.static) {
      brandCheck = "";
      getterBody = `return Impl.implementation["${this.idl.name}"];`;
      setterBody = `Impl.implementation["${this.idl.name}"] = V;`;
    } else if (shouldReflect) {
      const processedOutput = this.ctx.invokeProcessReflect(this.idl, "esValue[implSymbol]", { requires });
      getterBody = processedOutput.get;
      setterBody = processedOutput.set;
    }

    const replaceable = utils.getExtAttr(this.idl.extAttrs, "Replaceable");
    const legacyLenientSetter = utils.getExtAttr(this.idl.extAttrs, "LegacyLenientSetter");
    const legacyLenientThis = utils.getExtAttr(this.idl.extAttrs, "LegacyLenientThis");

    if (legacyLenientThis) {
      brandCheck = `
        if (!exports.is(esValue)) {
          return;
        }
      `;
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
      ${promiseHandlingBefore}
      const esValue = this !== null && this !== undefined ? this : globalObject;
      ${brandCheck.replace("$KEYWORD$", "get")}
      ${getterBody}
      ${promiseHandlingAfter}
    `, "get", { configurable });

    brandCheck = brandCheck.replace("$KEYWORD$", "set");

    if (!this.idl.readonly) {
      if (async) {
        throw new Error(`Illegal promise-typed attribute "${this.idl.name}" in interface "${this.interface.idl.name}"`);
      }

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
          this.ctx,
          "V",
          this.idl.idlType,
          this.idl.extAttrs,
          this.interface.name,
          `"Failed to set the '${this.idl.name}' property on '${this.interface.name}': The provided value"`
        );
        requires.merge(conv.requires);
        idlConversion = conv.body;
      }

      addMethod(this.idl.name, ["V"], `
        const esValue = this !== null && this !== undefined ? this : globalObject;
        ${brandCheck}
        ${idlConversion}
        ${setterBody}
      `, "set", { configurable });
    } else {
      const putForwards = utils.getExtAttr(this.idl.extAttrs, "PutForwards");

      setterBody = "";
      if (replaceable) {
        if (legacyLenientThis) {
          brandCheck = "";
        }

        setterBody = `
          Object.defineProperty(esValue, "${this.idl.name}", {
            configurable: true,
            enumerable: true,
            value: V,
            writable: true
          });
        `;
      } else if (putForwards) {
        setterBody = `
          const Q = esValue["${this.idl.name}"];
          if (!utils.isObject(Q)) {
            throw new globalObject.TypeError("Property '${this.idl.name}' is not an object");
          }
        `;

        // WebIDL calls the `Set` abstract operation with a `Throw` value of `false`:
        setterBody += `Reflect.set(Q, "${putForwards.rhs.value}", V);`;
      }

      if (setterBody) {
        addMethod(this.idl.name, ["V"], `
          const esValue = this !== null && this !== undefined ? this : globalObject;
          ${brandCheck}
          ${setterBody}
        `, "set", { configurable });
      } else if (legacyLenientSetter) {
        const body = legacyLenientThis ?
          "" :
          `
            const esValue = this !== null && this !== undefined ? this : globalObject;
            ${brandCheck}
          `;

        addMethod(this.idl.name, ["V"], body, "set", { configurable });
      }
    }

    if (!this.static && this.idl.special === "stringifier") {
      addMethod("toString", [], `
        const esValue = this;
        if (!exports.is(esValue)) {
          throw new globalObject.TypeError("'toString' called on an object that is not a valid instance of ${this.interface.name}.");
        }

        ${getterBody}
      `, "regular", { configurable, writable: configurable });
    }

    return { requires };
  }
}

module.exports = Attribute;
