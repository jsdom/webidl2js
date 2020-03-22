"use strict";
const { extname } = require("path");

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

function hasCEReactions(idl) {
  return Boolean(getExtAttr(idl.extAttrs, "CEReactions"));
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

function toKey(type, func = "") {
  return String(func + type).replace(/[./-]+/g, " ").trim().replace(/ /g, "_");
}

const PACKAGE_NAME_REGEX = /^(?:@([^/]+?)[/])?([^/]+?)$/u;

class RequiresMap extends Map {
  constructor(ctx) {
    super();
    this.ctx = ctx;
  }

  add(name, func = "") {
    const key = toKey(name, func);

    // If `name` is a package name or has a file extension, then use it as-is,
    // otherwise append the `.js` file extension:
    const importPath = PACKAGE_NAME_REGEX.test(name) || extname(name) ? name : `${name}.js`;
    let req = `require(${JSON.stringify(importPath)})`;

    if (func) {
      req += `.${func}`;
    }

    this.addRaw(key, req);
    return key;
  }

  addRelative(type, func = "") {
    const key = toKey(type, func);

    const path = type.startsWith(".") ? type : `./${type}`;
    let req = `require("${path}.js")`;

    if (func) {
      req += `.${func}`;
    }

    this.addRaw(key, req);
    return key;
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
  hasCEReactions,
  isOnInstance,
  stringifyPropertyKey,
  stringifyPropertyName,
  RequiresMap
};
