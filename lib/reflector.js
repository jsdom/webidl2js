"use strict";

module.exports["boolean"] = {
  get(objName, attrName) {
    return `return this.hasAttribute("${attrName}");`;
  },
  set(objName, attrName) {
    return `
      if (V) {
        this.setAttribute("${attrName}", "");
      } else {
        this.removeAttribute("${attrName}");
      }
    `;
  }
};

module.exports["DOMString"] = {
  get(objName, attrName) {
    return `
      const value = this.getAttribute("${attrName}");
      return value === null ? "" : value;
    `;
  },
  set(objName, attrName) {
    return `this.setAttribute("${attrName}", V);`;
  }
};

module.exports["long"] = {
  get(objName, attrName) {
    return `
      const value = parseInt(this.getAttribute("${attrName}"));
      return isNaN(value) || value < -2147483648 || value > 2147483647 ? 0 : value
    `;
  },
  set(objName, attrName) {
    return `this.setAttribute("${attrName}", String(V));`;
  }
};

module.exports["unsigned long"] = {
  get(objName, attrName) {
    return `
      const value = parseInt(this.getAttribute("${attrName}"));
      return isNaN(value) || value < 0 || value > 2147483647 ? 0 : value
    `;
  },
  set(objName, attrName) {
    return `this.setAttribute("${attrName}", String(V > 2147483647 ? 0 : V));`;
  }
};
