"use strict";

class Context {
  constructor({ implSuffix = "" } = {}) {
    this.implSuffix = implSuffix;
    this.initialize();
  }

  initialize() {
    this.customTypes = new Map();
    this.interfaces = Object.create(null);
    this.dictionaries = Object.create(null);
  }
}

module.exports = Context;
