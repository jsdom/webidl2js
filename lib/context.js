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

class Context {
  constructor({ implSuffix = "", options } = {}) {
    this.implSuffix = implSuffix;
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
}

module.exports = Context;
