"use strict";

const utils = require("../utils.js");
const Types = require("../types.js");
const Constant = require("./constant.js");

class CallbackInterface {
  constructor(ctx, idl) {
    this.ctx = ctx;
    this.idl = idl;
    this.name = idl.name;
    this.str = null;

    this.requires = new utils.RequiresMap(ctx);

    this.operation = null;
    this.constants = new Map();

    this._analyzed = false;
    this._outputStaticProperties = new Map();
  }

  _analyzeMembers() {
    for (const member of this.idl.members) {
      switch (member.type) {
        case "operation":
          if (this.operation !== null) {
            throw new Error(
              `Callback interface ${this.name} has more than one operation`
            );
          }
          this.operation = member;
          break;
        case "const":
          this.constants.set(member.name, new Constant(this.ctx, this, member));
          break;
        default:
          if (!this.ctx.options.suppressErrors) {
            throw new Error(
              `Unknown IDL member type "${member.type}" in callback interface ${this.name}`
            );
          }
      }
    }

    if (this.operation === null) {
      throw new Error(`Callback interface ${this.name} has no operation`);
    }
  }

  addAllProperties() {
    for (const member of this.constants.values()) {
      const data = member.generate();
      this.requires.merge(data.requires);
    }
  }

  addStaticProperty(name, body, {
    configurable = true,
    enumerable = typeof name === "string",
    writable = true
  } = {}) {
    const descriptor = { configurable, enumerable, writable };
    this._outputStaticProperties.set(name, { body, descriptor });
  }

  addProperty() {}

  generateConversion() {
    const { operation, name } = this;
    const opName = operation.name;
    const isAsync =
      (operation.idlType.union &&
        operation.idlType.idlType.some(
          idlType => idlType.generic === "Promise"
        )) ||
      operation.idlType.generic === "Promise";

    this.str += `
      exports.convert = function convert(value, { context = "The provided value" } = {}) {
        if (!utils.isObject(value)) {
          throw new TypeError(\`\${context} is not an object.\`);
        }

        return {
          wrapper(...args) {
            let completion;
            let thisArg = this;
            let O = value;
            let X = O;
    `;

    if (isAsync) {
      this.str += `
            try {
      `;
    }

    this.str += `
            if (typeof O !== "function") {
              X = O[${utils.stringifyPropertyName(opName)}];
              if (typeof X !== "function") {
                throw new TypeError(\`\${context} does not correctly implement ${name}.\`)
              }
              thisArg = O;
            }


            for (let i = 0; i < args.length; i++) {
              args[i] = utils.tryWrapperForImpl(args[i]);
            }
            if (args.length < ${operation.arguments.length}) {
              for (let i = args.length; i < ${operation.arguments.length}; i++) {
                args[i] = undefined;
              }
            } else if (args.length > ${operation.arguments.length}) {
              args.length = ${operation.arguments.length};
            }

            let callResult = Reflect.apply(X, thisArg, args);
    `;

    if (operation.idlType.idlType !== "void") {
      const conv = Types.generateTypeConversion(
        this.ctx,
        "callResult",
        operation.idlType,
        [],
        name,
        "context"
      );
      this.requires.merge(conv.requires);
      this.str += `
            ${conv.body}
            return callResult;
      `;
    }

    if (isAsync) {
      this.str += `
            } catch (err) {
              return Promise.reject(err);
            }
      `;
    }

    this.str += `
          }
        }.wrapper;
      };
    `;
  }

  generateOffInstanceAfterClass() {
    const classProps = new Map();

    for (const [name, { body, descriptor }] of this._outputStaticProperties) {
      const descriptorModifier = utils.getPropertyDescriptorModifier(
        utils.defaultDefinePropertyDescriptor,
        descriptor,
        "regular",
        body
      );
      classProps.set(utils.stringifyPropertyKey(name), descriptorModifier);
    }

    if (classProps.size > 0) {
      const props = [...classProps].map(([name, body]) => `${name}: ${body}`);
      this.str += `
        Object.defineProperties(${this.name}, { ${props.join(", ")} });
      `;
    }
  }

  generateInstall() {
    this.str += `
      exports.install = function install(globalObject) {
    `;

    if (this.constants.size > 0) {
      const { name } = this;

      this.str += `
        const ${name} = () => {
          throw new TypeError("Illegal invocation");
        }
      `;

      this.generateOffInstanceAfterClass();

      this.str += `
        if (globalObject[ctorRegistry] === undefined) {
          globalObject[ctorRegistry] = Object.create(null);
        }
        globalObject[ctorRegistry][interfaceName] = ${name};

        Object.defineProperty(globalObject, interfaceName, {
          configurable: true,
          writable: true,
          value: ${name}
        });
      `;
    }

    this.str += `
      };
    `;
  }

  generate() {
    this.str += `
      const interfaceName = "${this.name}";
    `;
    this.generateConversion();
    this.generateInstall();
  }

  toString() {
    this.str = "";
    if (!this._analyzed) {
      this._analyzed = true;
      this._analyzeMembers();
    }
    this.addAllProperties();
    this.generate();
    return this.str;
  }
}

module.exports = CallbackInterface;
