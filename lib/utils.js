"use strict";

module.exports.getExtAttr = function getExtAttr(attrs, name) {
  for (let i = 0; i < attrs.length; ++i) {
    if (attrs[i].name === name) {
      return attrs[i];
    }
  }

  return null;
};

module.exports.isGlobal = function isGlobal(idl) {
  const isGlobal = !!module.exports.getExtAttr(idl.extAttrs, "Global") ||
                   !!module.exports.getExtAttr(idl.extAttrs, "PrimaryGlobal");
  return isGlobal;
};

module.exports.isPairIterable = function isPairIterable(idl) {
  return idl.type === "iterable" && Array.isArray(idl.idlType) && idl.idlType.length === 2;
};

module.exports.isOnInstance = (memberIDL, interfaceIDL) => {
  return module.exports.getExtAttr(memberIDL.extAttrs, "Unforgeable") || module.exports.isGlobal(interfaceIDL);
};
