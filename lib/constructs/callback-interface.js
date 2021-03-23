"use strict";

const conversions = require("webidl-conversions");

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

    const exposed = utils.getExtAttr(this.idl.extAttrs, "Exposed");
    if (this.idl.members.some(member => member.type === "const") && !exposed) {
      throw new Error(`Callback interface ${this.name} with defined constants lacks the [Exposed] extended attribute`);
    }

    if (exposed) {
      if (!exposed.rhs || (exposed.rhs.type !== "identifier" && exposed.rhs.type !== "identifier-list")) {
        throw new Error(`[Exposed] must take an identifier or an identifier list in callback interface ${this.name}`);
      }

      if (exposed.rhs.type === "identifier") {
        this.exposed = new Set([exposed.rhs.value]);
      } else {
        this.exposed = new Set(exposed.rhs.value.map(token => token.value));
      }
    } else {
      this.exposed = new Set();
    }
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
          throw new Error(
            `Illegal IDL member type "${member.type}" in callback interface ${this.name}`
          );
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

  addStaticProperty(name, body, { configurable = true, enumerable = typeof name === "string", writable = true } = {}) {
    const descriptor = { configurable, enumerable, writable };
    this._outputStaticProperties.set(name, { body, descriptor });
  }

  // This is necessary due to usage in the `Constant` and other classes
  // It's empty because callback interfaces don't generate platform objects
  addProperty() {}

  generateConversion() {
    const { operation, name } = this;
    const opName = operation.name;
    const isAsync = operation.idlType.generic === "Promise";

    const argNames = operation.arguments.map(arg => arg.name);
    if (operation.arguments.some(arg => arg.optional || arg.variadic)) {
      throw new Error("Internal error: optional/variadic arguments are not implemented for callback interfaces");
    }

    this.str += `
      exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
        if (!utils.isObject(value)) {
          throw new globalObject.TypeError(\`\${context} is not an object.\`);
        }

        function callTheUserObjectsOperation(${argNames.join(", ")}) {
          let thisArg = utils.tryWrapperForImpl(this);
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
                throw new globalObject.TypeError(\`\${context} does not correctly implement ${name}.\`)
              }
              thisArg = O;
            }
    `;

    // We don't implement all of https://heycam.github.io/webidl/#web-idl-arguments-list-converting since the callers
    // are assumed to always pass the correct number of arguments and we don't support optional/variadic arguments.
    // See also: https://github.com/jsdom/webidl2js/issues/71
    for (const arg of operation.arguments) {
      const argName = arg.name;
      if (arg.idlType.union ?
        arg.idlType.idlType.some(type => !conversions[type]) :
        !conversions[arg.idlType.idlType]) {
        this.str += `
            ${argName} = utils.tryWrapperForImpl(${argName});
        `;
      }
    }

    this.str += `
            let callResult = Reflect.apply(X, thisArg, [${argNames.join(", ")}]);
    `;

    if (operation.idlType.idlType !== "undefined") {
      const conv = Types.generateTypeConversion(this.ctx, "callResult", operation.idlType, [], name, "context");
      this.requires.merge(conv.requires);
      this.str += `
            ${conv.body}
            return callResult;
      `;
    }

    if (isAsync) {
      this.str += `
          } catch (err) {
            return globalObject.Promise.reject(err);
          }
      `;
    }

    this.str += `
        };
    `;

    // The wrapperSymbol ensures that if the callback interface is used as a return value, e.g. in NodeIterator's filter
    // attribute, that it exposes the original callback back. I.e. it implements the conversion from IDL to JS value in
    // https://heycam.github.io/webidl/#es-callback-interface.
    //
    // The objectReference is used to implement spec text such as that discussed in
    // https://github.com/whatwg/dom/issues/842.
    this.str += `
        callTheUserObjectsOperation[utils.wrapperSymbol] = value;
        callTheUserObjectsOperation.objectReference = value;

        return callTheUserObjectsOperation;
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
    if (this.constants.size > 0) {
      this.str += `
        const exposed = new Set(${JSON.stringify([...this.exposed])});
      `;
    }

    this.str += `
      exports.install = (globalObject, globalNames) => {
    `;

    if (this.constants.size > 0) {
      const { name } = this;

      this.str += `
        if (!globalNames.some(globalName => exposed.has(globalName))) {
          return;
        }

        const ctorRegistry = utils.initCtorRegistry(globalObject);
        const ${name} = () => {
          throw new globalObject.TypeError("Illegal invocation");
        };
      `;

      this.generateOffInstanceAfterClass();

      this.str += `
        Object.defineProperty(globalObject, ${JSON.stringify(name)}, {
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

  generateRequires() {
    this.str = `
      ${this.requires.generate()}

      ${this.str}
    `;
  }

  generate() {
    this.generateConversion();
    this.generateInstall();

    this.generateRequires();
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

CallbackInterface.prototype.type = "callback interface";

module.exports = CallbackInterface;
