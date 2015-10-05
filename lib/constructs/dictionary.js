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

    this.str += `
    let key, value;`;
    fields.forEach(field => {
      this.str += `\n
    key = "${field.name}";
    value = obj === undefined || obj === null ? undefined : obj[key];`;
      const typeConversion = field.idlType;
      this.str += `
    if (value !== undefined) {`;
      const argAttrs = field.extAttrs;
      const enforceRange = utils.getExtAttr(argAttrs, "EnforceRange");
      const clamp = utils.getExtAttr(argAttrs, "Clamp");

      let optString = "";
      if (clamp) {
        optString = `, { clamp: true }`;
      } else if (enforceRange) {
        optString = `, { enforceRange: true }`;
      }

      let conversionFn = "";
      if (conversions[typeConversion.idlType]) {
        conversionFn = `conversions["${typeConversion.idlType}"]`;
      } else if (this.opts.customTypes.has(typeConversion.idlType)) {
        this.str = `const convert${typeConversion.idlType} = require("./${typeConversion.idlType}");\n` + this.str;
        conversionFn = `convert${typeConversion.idlType}`;
      }

      if (typeConversion.array) {
        this.str += `
      ret[key] = [];
      for (let i = 0; i < value.length; ++i) {
        ret[key][i] = ${conversionFn}(value[i]${optString});
      }`;
      } else {
        this.str += `
      ret[key] = ${conversionFn}(value${optString});`;
      }
      if (field.required) {
        this.str += `
    } else {
      throw new TypeError("${field.name} is required in '${this.name}'");`;
      } else if (field.default) {
        this.str += `
    } else {
      ret[key] = `;
        if (field.default.type === "null") {
          this.str += `null`;
        } else {
          this.str += JSON.stringify(field.default.value);
        }
      }
      this.str += `;
    }`;
    });
  }

  generate() {
    this.str = `
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

    return {
      requires: {},
      body: this.str
    };
  }
}

Dictionary.prototype.type = "dictionary";

module.exports = Dictionary;
