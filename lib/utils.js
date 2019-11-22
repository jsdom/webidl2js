"use strict";

function getDefault(dflt) {
  switch (dflt.type) {
    case "boolean":
    case "string":
      return JSON.stringify(dflt.value);
    case "number":
      return dflt.value;
    case "null":
    case "NaN":
      return dflt.type;
    case "Infinity":
      return `${dflt.negative ? "-" : ""}Infinity`;
    case "sequence":
      return "[]";
  }
  throw new Error("Unexpected default type: " + dflt.type);
}

function getExtAttr(attrs, name) {
  for (let i = 0; i < attrs.length; ++i) {
    if (attrs[i].name === name) {
      return attrs[i];
    }
  }

  return null;
}

function isGlobal(idl) {
  return Boolean(getExtAttr(idl.extAttrs, "Global"));
}

function isOnInstance(memberIDL, interfaceIDL) {
  return memberIDL.special !== "static" && (getExtAttr(memberIDL.extAttrs, "Unforgeable") || isGlobal(interfaceIDL));
}

function symbolName(symbol) {
  const desc = String(symbol).replace(/^Symbol\((.*)\)$/, "$1");
  if (!desc.startsWith("Symbol.")) {
    throw new Error(`Internal error: Unsupported property name ${String(symbol)}`);
  }
  return desc;
}

function propertyName(name) {
  // All Web IDL identifiers are valid JavaScript PropertyNames, other than those with '-'.
  const isJSIdentifier = !name.includes("-");
  if (isJSIdentifier) {
    return name;
  }
  return JSON.stringify(name);
}

function stringifyPropertyKey(prop) {
  return typeof prop === "symbol" ? `[${symbolName(prop)}]` : propertyName(prop);
}

function stringifyPropertyName(prop) {
  return typeof prop === "symbol" ? symbolName(prop) : JSON.stringify(propertyName(prop));
}

class RequiresMap extends Map {
  constructor(ctx) {
    super();
    this.ctx = ctx;
  }

  add(type, func = "") {
    const key = func + type;
    let req = `require("./${type}.js")`;
    if (func) {
      req += `.${func}`;
    }
    this.addRaw(key, req);
  }

  addRaw(key, expr) {
    if (this.has(key) && this.get(key) !== expr) {
      throw new Error(`Internal error: Variable name clash: ${key}; was ${this.get(key)}, adding: ${expr}`);
    }
    super.set(key, expr);
  }

  merge(src) {
    if (!src || !(src instanceof RequiresMap)) {
      return;
    }
    for (const [key, val] of src) {
      this.addRaw(key, val);
    }
  }

  generate() {
    return [...this.keys()].map(key => `const ${key} = ${this.get(key)};`).join("\n");
  }
}

module.exports = {
  getDefault,
  getExtAttr,
  isGlobal,
  isOnInstance,
  stringifyPropertyKey,
  stringifyPropertyName,
  RequiresMap
};
