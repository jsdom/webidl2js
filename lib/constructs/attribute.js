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
    this.namespace = I.type === "namespace";
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

    const whence = this.namespace ? null : this.getWhence();
    const configurable = whence !== "unforgeables";
    const shouldReflect =
      !this.namespace && this.idl.extAttrs.some(attr => attr.name.startsWith("Reflect")) &&
      this.ctx.processReflect !== null;
    const sameObject = utils.getExtAttr(this.idl.extAttrs, "SameObject");

    const async = this.idl.idlType.generic === "Promise";
    const promiseHandlingBefore = async ? `try {` : ``;
    const promiseHandlingAfter = async ? `} catch (e) { return globalObject.Promise.reject(e); }` : ``;

    const legacyLenientThis = utils.getExtAttr(this.idl.extAttrs, "LegacyLenientThis");
    const brandCheck = keyword => {
      if (this.static || this.namespace) {
        return "";
      }
      return utils.generateBrandCheck(this.interface.name, `${keyword} ${this.idl.name}`, {
        lenient: Boolean(legacyLenientThis)
      });
    };
    let getterBody = `return utils.tryWrapperForImpl($impl["${this.idl.name}"]);`;
    let setterBody = `$impl["${this.idl.name}"] = V;`;
    if (conversions[this.idl.idlType.idlType]) {
      getterBody = `return $impl["${this.idl.name}"];`;
    }

    const addMethod = this.static || this.namespace ?
      this.interface.addStaticMethod.bind(this.interface) :
      this.interface.addMethod.bind(this.interface, whence);

    if (this.static || this.namespace) {
      getterBody = conversions[this.idl.idlType.idlType] ?
        `return Impl.implementation["${this.idl.name}"];` :
        `return utils.tryWrapperForImpl(Impl.implementation["${this.idl.name}"]);`;
      setterBody = `Impl.implementation["${this.idl.name}"] = V;`;
    } else if (shouldReflect) {
      const processedOutput = this.ctx.invokeProcessReflect(this.idl, "$impl", { requires });
      getterBody = processedOutput.get;
      setterBody = processedOutput.set;
    }

    const replaceable = utils.getExtAttr(this.idl.extAttrs, "Replaceable");
    const legacyLenientSetter = utils.getExtAttr(this.idl.extAttrs, "LegacyLenientSetter");

    if (sameObject) {
      const cacheKey = this.namespace ? "namespaceObject" : "this";
      getterBody = `return utils.getSameObject(${cacheKey}, "${this.idl.name}", () => { ${getterBody} });`;
    }

    if (utils.hasCEReactions(this.idl)) {
      const processorConfig = { requires };

      getterBody = this.ctx.invokeProcessCEReactions(getterBody, processorConfig);
      setterBody = this.ctx.invokeProcessCEReactions(setterBody, processorConfig);
    }

    addMethod(this.idl.name, [], `
      ${promiseHandlingBefore}
      ${brandCheck("get")}
      ${getterBody}
      ${promiseHandlingAfter}
    `, "get", { configurable });

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
        ${brandCheck("set")}
        ${idlConversion}
        ${setterBody}
      `, "set", { configurable });
    } else {
      const putForwards = utils.getExtAttr(this.idl.extAttrs, "PutForwards");

      setterBody = "";
      if (replaceable) {
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
          const esValue = this ?? globalObject;
          ${replaceable && legacyLenientThis ? "" : brandCheck("set")}
          ${setterBody}
        `, "set", { configurable });
      } else if (legacyLenientSetter) {
        const body = legacyLenientThis ? "" : brandCheck("set");

        addMethod(this.idl.name, ["V"], body, "set", { configurable });
      }
    }

    if (!this.static && !this.namespace && this.idl.special === "stringifier") {
      addMethod("toString", [], `
        ${utils.generateBrandCheck(this.interface.name, "toString", { receiver: "this" })}

        ${getterBody}
      `, "regular", { configurable, writable: configurable });
    }

    return { requires };
  }
}

module.exports = Attribute;
