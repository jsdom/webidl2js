"use strict";

module.exports["boolean"] = {
  get(objName, attrName) {
    return `return this.hasAttribute("${attrName}");`;
  },
  set(objName, attrName) {
    return `if (V) {
    this.setAttribute("${attrName}", "");
  } else {
    this.removeAttribute("${attrName}");
  }`;
  }
};

module.exports["DOMString"] = {
  get(objName, attrName) {
    return `const value = this.getAttribute("${attrName}");
    return value === null ? "" : value;`;
  },
  set(objName, attrName) {
    return `this.setAttribute("${attrName}", V);`;
  }
};

["long", "unsigned long"].forEach((key) => {
  module.exports[key] = {
    get(objName, attrName) {
      return `const value = this.getAttribute("${attrName}");
      return value === null ? "" : String(value);`;
    },
    set(objName, attrName) {
      return `this.setAttribute("${attrName}", String(V));`;
    }
  };
});
