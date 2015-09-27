"use strict";

const conversions = require("webidl-conversions");
const utils = require("../utils");

class Dictionary {
  constructor(idl, opts) {
    this.idl = idl;
    this.name = idl.name;
    this.opts = opts;
  }

  _generateConversions() {
    const fields = [];
    const members = this.idl.members;
    members.forEach(member => {
      if (member.type !== 'field') {
        throw new Error("webidl2js doesn't support non-field members in dictionaries");
      }
      fields.push(member);
    });

    fields.sort((a, b) => a.name < b.name ? -1 : 1);


    fields.forEach(field => {
      const typeConversion = field.idlType;
      if (!conversions[typeConversion.idlType] && !this.opts.customTypes.has(typeConversion.idlType)) {
        this.str += `
    ret["${field.name}"] = obj["${field.name}"];`;
        return;
      }

      const argAttrs = field.extAttrs;
      const enforceRange = utils.hasExtAttr(argAttrs, "EnforceRange");
      const clamp = utils.hasExtAttr(argAttrs, "Clamp");

      let optString = "";
      if (clamp) {
        optString = `, { clamp: true }`;
      } else if (enforceRange) {
        optString = `, { enforceRange: true }`;
      }

      let conversionFn = null;
      if (conversions[typeConversion.idlType]) {
        conversionFn = `conversions["${typeConversion.idlType}"]`;
      } else {
        this.str = `const convert${typeConversion.idlType} = require("./${typeConversion.idlType}");\n` + this.str;
        conversionFn = `convert${typeConversion.idlType}`;
      }
      if (typeConversion.array) {
        this.str += `
    ret["${field.name}"] = [];
    for (let i = 0; i < obj["${field.name}"].length; ++i) {
      ret["${field.name}"][i] = ${conversionFn}(obj["${field.name}"][i]${optString});
    }`;
      } else {
        this.str += `
    ret["${field.name}"] = ${conversionFn}(obj["${field.name}"]${optString});`;
      }
    });
  }

  generate() {
    this.str += `
module.exports = {
  convertInherit(obj, ret) {`;
    if (this.idl.inheritance) {
      this.str = `const ${this.idl.inheritance} = require("./${this.idl.inheritance}");\n` + this.str;
      this.str += `
    ${this.idl.inheritance}.convertInherit(obj, ret);`;
    }
    this._generateConversions();
    this.str += `
  },

  convert(obj) {
    if (obj !== undefined && typeof obj !== "object") {
      throw new TypeError("Dictionary has to be an object");
    }
    if (obj instanceof Date || obj instanceof RegExp) {
      throw new TypeError("Dictionary may not be a Date or RegExp object");
    }

    const ret = Object.create(null);
    module.exports.convertInherit(obj, ret);
    return ret;
  }
};`;
  }

  toString() {
    this.str = "";
    this.generate();
    return this.str;
  }
}

Dictionary.prototype.type = "dictionary";

module.exports = Dictionary;
