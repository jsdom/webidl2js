"use strict";

module.exports["boolean"] = {
  get: function (attrName) {
    return `return Element.prototype.hasAttribute.call(this, "${attrName}");`;
  },
  set: function (attrName) {
    return `if (V) {
    Element.prototype.setAttribute.call(this, "${attrName}", "");
  } else {
    Element.prototype.removeAttribute.call(this, "${attrName}");
  }`;
  }
};

module.exports["DOMString"] = {
  get: function (attrName) {
    return `const value = Element.prototype.getAttribute.call(this, "${attrName}");
    return value === null ? "" : value;`;
  },
  set: function (attrName) {
    return `Element.prototype.setAttribute.call(this, "${attrName}", V);`;
  }
}