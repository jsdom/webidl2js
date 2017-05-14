"use strict";

const conversions = require("webidl-conversions");

const utils = require("../utils");
const reflector = require("../reflector");
const Types = require("../types");

function Attribute(ctx, obj, I, idl) {
  this.ctx = ctx;
  this.obj = obj;
  this.interface = I;
  this.idl = idl;
}

Attribute.prototype.generate = function () {
  let str = "";
  let requires = {};

  const configurable = !utils.getExtAttr(this.idl.extAttrs, "Unforgeable");
  const shouldReflect = utils.getExtAttr(this.idl.extAttrs, "Reflect");
  const sameObject = utils.getExtAttr(this.idl.extAttrs, "SameObject");

  let objName = `this`;
  let definedOn = this.obj.name + (this.idl.static ? "" : ".prototype");
  if (utils.isOnInstance(this.idl, this.interface)) { // we're in a setup method
    objName = `obj`;
    definedOn = `obj`;
  }
  let getterBody = `return utils.tryWrapperForImpl(${objName}[impl].${this.idl.name});`;
  let setterBody = `${objName}[impl].${this.idl.name} = V;`;
  if (conversions[this.idl.idlType.idlType]) {
    getterBody = `return ${objName}[impl].${this.idl.name};`;
  }

  if (this.idl.static) {
    getterBody = `return Impl.${this.idl.name};`;
    setterBody = `Impl.${this.idl.name} = V;`;
  } else if (shouldReflect) {
    if (!reflector[this.idl.idlType.idlType]) {
      throw new Error("Unknown reflector type: " + this.idl.idlType.idlType);
    }
    const attrName = shouldReflect.rhs && shouldReflect.rhs.value.replace(/_/g, '-') || this.idl.name;
    getterBody = reflector[this.idl.idlType.idlType].get(objName, attrName);
    setterBody = reflector[this.idl.idlType.idlType].set(objName, attrName);
  }

  if (sameObject) {
    getterBody = `return utils.getSameObject(this, "${this.idl.name}", () => { ${getterBody} });`;
  }

  str += `Object.defineProperty(${definedOn}, "${this.idl.name}", {
  get() {
    ${getterBody}
  },`;
  if (!this.idl.readonly) {
    const conv = Types.generateTypeConversion(this.ctx, "V", this.idl.idlType, this.idl.extAttrs, this.interface.name, `"Failed to set the '${this.idl.name}' property on '${this.interface.name}': The provided value"`);
    Object.assign(requires, conv.requires);
    let conversion = conv.body.replace(/\n/g, "\n  ");
    str += `
  set(V) {${conversion}
    ${setterBody}
  },`;
  } else if (utils.getExtAttr(this.idl.extAttrs, "PutForwards")) {
    str += `
  set(V) {
    this.${this.idl.name}.${utils.getExtAttr(this.idl.extAttrs, "PutForwards").rhs.value} = V;
  },`;
  } else if (utils.getExtAttr(this.idl.extAttrs, "Replaceable")) {
    str += `
  set(V) {
    Object.defineProperty(this, "${this.idl.name}", {
      configurable: true,
      enumerable: true,
      value: V,
      writable: true
    });
  },`;
  }
  str += `
  enumerable: true,
  configurable: ${JSON.stringify(configurable)}
});\n\n`;

  if (this.idl.stringifier) {
    const functionExpression = `
      function toString() {
        if (!this || !module.exports.is(this)) {
          throw new TypeError("Illegal invocation");
        }
        ${getterBody};
      }
    `;

    if (utils.getExtAttr(this.idl.extAttrs, "Unforgeable")) {
      str += `
        Object.defineProperty(${definedOn}, "toString", {
          writable: false,
          enumerable: true,
          configurable: false,
          value: ${functionExpression}
        });
      `;
    } else {
      str += `
        ${definedOn}.toString = ${functionExpression};
      `;
    }
    str += "\n";
  }

  return {
    requires,
    body: str
  };
};

module.exports = Attribute;
