"use strict";
const webidl = require("webidl2");
const CallbackFunction = require("./constructs/callback-function.js");
const Typedef = require("./constructs/typedef");

const builtinTypes = webidl.parse(`
  typedef (Int8Array or Int16Array or Int32Array or
           Uint8Array or Uint16Array or Uint32Array or Uint8ClampedArray or
           Float32Array or Float64Array or DataView) ArrayBufferView;
  typedef (ArrayBufferView or ArrayBuffer) BufferSource;
  typedef unsigned long long DOMTimeStamp;

  callback Function = any (any... arguments);
  callback VoidFunction = undefined ();
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
    options = { suppressErrors: false }
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
    this.callbackInterfaces = new Map();
    this.callbackFunctions = new Map();
    this.dictionaries = new Map();
    this.enumerations = new Map();

    for (const idl of builtinTypes) {
      switch (idl.type) {
        case "typedef":
          this.typedefs.set(idl.name, new Typedef(this, idl));
          break;
        case "callback":
          this.callbackFunctions.set(idl.name, new CallbackFunction(this, idl));
          break;
      }
    }
  }

  typeOf(name) {
    if (this.typedefs.has(name)) {
      return "typedef";
    }
    if (this.interfaces.has(name)) {
      return "interface";
    }
    if (this.callbackInterfaces.has(name)) {
      return "callback interface";
    }
    if (this.callbackFunctions.has(name)) {
      return "callback";
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
