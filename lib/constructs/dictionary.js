"use strict";

const Types = require("../types");
const utils = require("../utils");

class Dictionary {
  constructor(ctx, idl) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;

    this.requires = new utils.RequiresMap(ctx);
  }

  _prepareFields() {
    const fields = [];
    const members = this.idl.members;
    members.forEach(member => {
      if (member.type !== "field") {
        throw new Error("webidl2js doesn't support non-field members in dictionaries");
      }
      fields.push(member);
    });

    fields.sort((a, b) => a.name < b.name ? -1 : 1);
    return fields;
  }

  _generateConversions() {
    let str = "";

    for (const field of this._prepareFields()) {
      const typeConversion = field.idlType;
      const argAttrs = field.extAttrs;
      const conv = Types.generateTypeConversion(
        this.ctx, "value", typeConversion, argAttrs, this.name, `context + " has member ${field.name} that"`);
      this.requires.merge(conv.requires);

      str += `
        {
          const key = "${field.name}";
          let value = obj === undefined || obj === null ? undefined : obj[key];
          if (value !== undefined) {
            ${conv.body}
            ret[key] = value;
          }
      `;

      if (field.required) {
        str += `
          else {
            throw new TypeError("${field.name} is required in '${this.name}'");
          }
        `;
      } else if (field.default) {
        str += `
          else {
            ret[key] = ${utils.getDefault(field.default)};
          }
        `;
      }

      str += `
        }
      `;
    }

    return str;
  }

  generate() {
    this.str += `
      exports.convertInherit = function convertInherit(obj, ret, { context = "The provided value" } = {}) {
    `;

    if (this.idl.inheritance) {
      this.str += `
          ${this.idl.inheritance}.convertInherit(obj, ret, { context });
      `;
    }

    this.str += `
          ${this._generateConversions()}
        };

        exports.convert = function convert(obj, { context = "The provided value" } = {}) {
          if (obj !== undefined && typeof obj !== "object" && typeof obj !== "function") {
            throw new TypeError(\`\${context} is not an object.\`);
          }

          const ret = Object.create(null);
          module.exports.convertInherit(obj, ret, { context });
          return ret;
        };
    `;

    if (this.idl.inheritance) {
      this.requires.addRelative(this.idl.inheritance);
    }
    this.str = `
      ${this.requires.generate()}

      ${this.str}
    `;

    return this.str;
  }

  toString() {
    this.str = "";
    this.generate();
    return this.str;
  }
}

Dictionary.prototype.type = "dictionary";

module.exports = Dictionary;
