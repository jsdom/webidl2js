"use strict";

module.exports.boolean = {
  get(objName, attrName) {
    return `return this.hasAttributeNS(null, "${attrName}");`;
  },
  set(objName, attrName) {
    return `
      if (V) {
        this.setAttributeNS(null, "${attrName}", "");
      } else {
        this.removeAttributeNS(null, "${attrName}");
      }
    `;
  }
};

module.exports.DOMString = {
  get(objName, attrName) {
    return `
      const value = this.getAttributeNS(null, "${attrName}");
      return value === null ? "" : value;
    `;
  },
  set(objName, attrName) {
    return `this.setAttributeNS(null, "${attrName}", V);`;
  }
};

module.exports.long = {
  get(objName, attrName) {
    return `
      const value = parseInt(this.getAttributeNS(null, "${attrName}"));
      return isNaN(value) || value < -2147483648 || value > 2147483647 ? 0 : value
    `;
  },
  set(objName, attrName) {
    return `this.setAttributeNS(null, "${attrName}", String(V));`;
  }
};

module.exports["unsigned long"] = {
  get(objName, attrName) {
    return `
      const value = parseInt(this.getAttributeNS(null, "${attrName}"));
      return isNaN(value) || value < 0 || value > 2147483647 ? 0 : value
    `;
  },
  set(objName, attrName) {
    return `this.setAttributeNS(null, "${attrName}", String(V > 2147483647 ? 0 : V));`;
  }
};
