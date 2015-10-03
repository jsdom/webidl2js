"use strict";

module.exports["boolean"] = {
  get(objName, attrName) {
    return `return Element.prototype.hasAttribute.call(${objName}, "${attrName}");`;
  },
  set(objName, attrName) {
    return `if (V) {
    Element.prototype.setAttribute.call(${objName}, "${attrName}", "");
  } else {
    Element.prototype.removeAttribute.call(${objName}, "${attrName}");
  }`;
  }
};

module.exports["DOMString"] = {
  get(objName, attrName) {
    return `const value = Element.prototype.getAttribute.call(${objName}, "${attrName}");
    return value === null ? "" : value;`;
  },
  set(objName, attrName) {
    return `Element.prototype.setAttribute.call(${objName}, "${attrName}", V);`;
  }
}