"use strict";

const Types = require("../types");
const utils = require("../utils");

class Dictionary {
  constructor(ctx, idl) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;
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

      const conv = Types.generateTypeConversion(this.ctx, "value", typeConversion, argAttrs, this.name, `\`\${context} has member ${field.name} that\``);
      for (let key in conv.requires) {
        this.str = `const ${key} = ${conv.requires[key]};\n` + this.str;
      }
      this.str += conv.body;
      this.str += `
    ret[key] = value;`

      if (field.required) {
        this.str += `
    } else {
      throw new TypeError("${field.name} is required in '${this.name}'");`;
      } else if (field.default) {
        this.str += `
    } else {
      ret[key] = `;
        if (field.default.type === "null") {
          this.str += `null;`;
        } else {
          this.str += JSON.stringify(field.default.value) + ';';
        }
      }
      this.str += `
    }`;
    });
  }

  generate() {
    this.str += `
module.exports = {
  convertInherit(obj, ret, { context = "The provided value" } = {}) {`;
    if (this.idl.inheritance) {
      this.str = `const ${this.idl.inheritance} = require("./${this.idl.inheritance}");\n` + this.str;
      this.str += `
    ${this.idl.inheritance}.convertInherit(obj, ret, { context });`;
    }
    this._generateConversions();
    this.str += `
  },

  convert(obj, { context = "The provided value" } = {}) {
    if (obj !== undefined && typeof obj !== "object") {
      throw new TypeError(\`\${context} is not an object.\`);
    }

    const ret = Object.create(null);
    module.exports.convertInherit(obj, ret, { context });
    return ret;
  }
};`;

    return this.str;
  }

  toString() {
    this.str = ``;
    this.generate();
    return this.str;
  }
}

Dictionary.prototype.type = "dictionary";

module.exports = Dictionary;
