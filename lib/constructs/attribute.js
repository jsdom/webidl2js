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

  get observableArrayType() {
    const type = Types.resolveType(this.ctx, this.idl.idlType);
    return type.generic === "ObservableArray" ? type : null;
  }

  generateObservableArraySetup() {
    const conv = Types.generateTypeConversion(
      this.ctx,
      "value",
      this.observableArrayType.idlType[0],
      [],
      this.interface.name,
      `Failed to modify the '${this.idl.name}' observable array on '${this.interface.name}': The provided value`,
    );
    return {
      requires: conv.requires,
      body: `
        utils.initObservableArray(impl, globalObject, "${this.idl.name}", value => {
          ${conv.body}
          return value;
        });
      `,
    };
  }

  generateGetter(requires) {
    const shouldReflect =
      !this.namespace &&
      this.idl.extAttrs.some((attr) => attr.name.startsWith("Reflect")) &&
      this.ctx.processReflect !== null;
    if (!this.static && shouldReflect) {
      return this.ctx.invokeProcessReflect(this.idl, "$impl", { requires });
    }
    const target = this.static || this.namespace ? "Impl.implementation" : "$impl";
    const value = `${target}["${this.idl.name}"]`;
    const getExpression = conversions[this.idl.idlType.idlType]
      ? value
      : `utils.tryWrapperForImpl(${value})`;
    return {
      get: `return ${getExpression};`,
      getExpression,
      set: `${value} = V;`,
    };
  }

  generate() {
    const requires = new utils.RequiresMap(this.ctx);

    const whence = this.namespace ? null : this.getWhence();
    const configurable = whence !== "unforgeables";
    const sameObject = utils.getExtAttr(this.idl.extAttrs, "SameObject");
    const { observableArrayType } = this;

    const async = this.idl.idlType.generic === "Promise";
    const promiseHandlingBefore = async ? `try {` : ``;
    const promiseHandlingAfter = async
      ? `} catch (e) { return globalObject.Promise.reject(e); }`
      : ``;

    const legacyLenientThis = utils.getExtAttr(this.idl.extAttrs, "LegacyLenientThis");
    const brandCheck = (keyword) => {
      if (this.static || this.namespace) {
        return "";
      }
      return this.interface.generateBrandCheck(`${keyword} ${this.idl.name}`, {
        lenient: Boolean(legacyLenientThis),
      });
    };
    let { get: getterBody, set: setterBody } = this.generateGetter(requires);

    const addMethod =
      this.static || this.namespace
        ? this.interface.addStaticMethod.bind(this.interface)
        : this.interface.addMethod.bind(this.interface, whence);

    const replaceable = utils.getExtAttr(this.idl.extAttrs, "Replaceable");
    const legacyLenientSetter = utils.getExtAttr(this.idl.extAttrs, "LegacyLenientSetter");

    if (observableArrayType) {
      getterBody = `return utils.getObservableArray($impl, "${this.idl.name}");`;
      setterBody = `utils.setObservableArray($impl, "${this.idl.name}", value);`;
    }

    if (sameObject && !observableArrayType) {
      const cacheKey = this.namespace ? "namespaceObject" : "this";
      getterBody = `return utils.getSameObject(${cacheKey}, "${this.idl.name}", () => { ${getterBody} });`;
    }

    if (utils.hasCEReactions(this.idl)) {
      const processorConfig = { requires };

      getterBody = this.ctx.invokeProcessCEReactions(getterBody, processorConfig);
      setterBody = this.ctx.invokeProcessCEReactions(setterBody, processorConfig);
    }

    addMethod(
      this.idl.name,
      [],
      `
      ${promiseHandlingBefore}
      ${brandCheck("get")}
      ${getterBody}
      ${promiseHandlingAfter}
    `,
      "get",
      { configurable },
    );

    if (!this.idl.readonly) {
      if (async) {
        throw new Error(
          `Illegal promise-typed attribute "${this.idl.name}" in interface "${this.interface.idl.name}"`,
        );
      }

      let idlConversion;
      if (
        typeof this.idl.idlType.idlType === "string" &&
        !this.idl.idlType.nullable &&
        this.ctx.enumerations.has(this.idl.idlType.idlType)
      ) {
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
          observableArrayType ? "value" : "V",
          observableArrayType ? { ...observableArrayType, generic: "sequence" } : this.idl.idlType,
          this.idl.extAttrs,
          this.interface.name,
          `Failed to set the '${this.idl.name}' property on '${this.interface.name}': The provided value`,
        );
        requires.merge(conv.requires);
        idlConversion = observableArrayType ? `let value = V; ${conv.body}` : conv.body;
      }

      addMethod(
        this.idl.name,
        ["V"],
        `
        ${brandCheck("set")}
        ${idlConversion}
        ${setterBody}
      `,
        "set",
        { configurable },
      );
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
        addMethod(
          this.idl.name,
          ["V"],
          `
          const esValue = this ?? globalObject;
          ${replaceable && legacyLenientThis ? "" : brandCheck("set")}
          ${setterBody}
        `,
          "set",
          { configurable },
        );
      } else if (legacyLenientSetter) {
        const body = legacyLenientThis ? "" : brandCheck("set");

        addMethod(this.idl.name, ["V"], body, "set", { configurable });
      }
    }

    if (!this.static && !this.namespace && this.idl.special === "stringifier") {
      addMethod(
        "toString",
        [],
        `
        ${this.interface.generateBrandCheck("toString", { receiver: "this" })}

        ${getterBody}
      `,
        "regular",
        { configurable, writable: configurable },
      );
    }

    return { requires };
  }
}

module.exports = Attribute;
