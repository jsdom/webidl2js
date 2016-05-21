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
