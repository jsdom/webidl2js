"use strict";

module.exports["boolean"] = {
  get(attrName) {
    return `return Element.prototype.hasAttribute.call(this, "${attrName}");`;
  },
  set(attrName) {
    return `if (V) {
    Element.prototype.setAttribute.call(this, "${attrName}", "");
  } else {
    Element.prototype.removeAttribute.call(this, "${attrName}");
  }`;
  }
};

module.exports["DOMString"] = {
  get(attrName) {
    return `const value = Element.prototype.getAttribute.call(this, "${attrName}");
    return value === null ? "" : value;`;
  },
  set(attrName) {
    return `Element.prototype.setAttribute.call(this, "${attrName}", V);`;
  }
}