"use strict";

module.exports.hasExtAttr = function hasExtAttr(attrs, name) {
  for (let i = 0; i < attrs.length; ++i) {
    if (attrs[i].name === name) {
      return true;
    }
  }

  return false;
};