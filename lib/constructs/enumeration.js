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
      module.exports = {
        enumerationValues,
        convert(value, { context = "The provided value" } = {}) {
          const string = \`\${value}\`;
          if (!enumerationValues.has(value)) {
            throw new TypeError(\`\${context} '\${value}' is not a valid enumeration value for ${this.name}\`);
          }
          return string;
        }
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
