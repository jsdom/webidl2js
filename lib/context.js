"use strict";
const webidl = require("webidl2");
const Typedef = require("./constructs/typedef");

const builtinTypedefs = webidl.parse(`
  typedef (Int8Array or Int16Array or Int32Array or
           Uint8Array or Uint16Array or Uint32Array or Uint8ClampedArray or
           Float32Array or Float64Array or DataView) ArrayBufferView;
  typedef (ArrayBufferView or ArrayBuffer) BufferSource;
  typedef unsigned long long DOMTimeStamp;
`);

function defaultProcessor(code) {
  return code;
}

class Context {
  constructor({
    implSuffix = "",
    processCEReactions = defaultProcessor,
    processHTMLConstructor = defaultProcessor,
    processReflect = null,
    options
  } = {}) {
    this.implSuffix = implSuffix;
    this.processCEReactions = processCEReactions;
    this.processHTMLConstructor = processHTMLConstructor;
    this.processReflect = processReflect;
    this.options = options;

    this.initialize();
  }

  initialize() {
    this.typedefs = new Map();
    this.interfaces = new Map();
    this.interfaceMixins = new Map();
    this.dictionaries = new Map();
    this.enumerations = new Map();

    for (const typedef of builtinTypedefs) {
      this.typedefs.set(typedef.name, new Typedef(this, typedef));
    }
  }

  typeOf(name) {
    if (this.typedefs.has(name)) {
      return "typedef";
    }
    if (this.interfaces.has(name)) {
      return "interface";
    }
    if (this.dictionaries.has(name)) {
      return "dictionary";
    }
    if (this.enumerations.has(name)) {
      return "enumeration";
    }
    return undefined;
  }

  invokeProcessCEReactions(code, config) {
    return this._invokeProcessor(this.processCEReactions, config, code);
  }

  invokeProcessHTMLConstructor(code, config) {
    return this._invokeProcessor(this.processHTMLConstructor, config, code);
  }

  invokeProcessReflect(idl, implName, config) {
    return this._invokeProcessor(this.processReflect, config, idl, implName);
  }

  _invokeProcessor(processor, config, ...args) {
    const { requires } = config;

    if (!requires) {
      throw new TypeError("Internal error: missing requires object in context");
    }

    const context = {
      addImport(source, imported) {
        return requires.add(source, imported);
      }
    };

    return processor.apply(context, args);
  }
}

module.exports = Context;
