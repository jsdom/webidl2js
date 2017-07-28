"use strict";

function getDefault(dflt) {
  switch (dflt.type) {
    case "boolean":
    case "number":
    case "string":
      return JSON.stringify(dflt.value);
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
  return Boolean(getExtAttr(idl.extAttrs, "Global")) ||
         Boolean(getExtAttr(idl.extAttrs, "PrimaryGlobal"));
}

function isPairIterable(idl) {
  return idl.type === "iterable" && Array.isArray(idl.idlType) && idl.idlType.length === 2;
}

function isOnInstance(memberIDL, interfaceIDL) {
  return getExtAttr(memberIDL.extAttrs, "Unforgeable") || isGlobal(interfaceIDL);
}

module.exports = {
  getDefault,
  getExtAttr,
  isGlobal,
  isPairIterable,
  isOnInstance
};
