"use strict";

class Enumeration {
  constructor(ctx, idl) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;
    this.str = null;
  }

  generate() {
    const values = new Set(this.idl.values.map(val => val.value));
    if (values.size !== this.idl.values.length) {
      throw new Error(`Duplicates found in ${this.name}'s enumeration values`);
    }

    this.str += `
      const enumerationValues = new Set(${JSON.stringify([...values])});
      exports.enumerationValues = enumerationValues;

      exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
        const string = \`\${value}\`;
        if (!enumerationValues.has(string)) {
          throw new globalObject.TypeError(\`\${context} '\${string}' is not a valid enumeration value for ${this.name}\`);
        }
        return string;
      };
    `;
  }

  toString() {
    this.str = "";
    this.generate();
    return this.str;
  }
}

module.exports = Enumeration;
