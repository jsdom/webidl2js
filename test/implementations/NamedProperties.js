"use strict";

const utils = require("../output/utils.js");

exports.implementation = class NamedPropertiesImpl {
  constructor() {
    this.entries = new Map();
    this.supportsCalls = [];
    this.namedCalls = [];
  }

  get length() {
    return this.entries.size;
  }

  [utils.supportsPropertyName](name) {
    this.supportsCalls.push(name);
    return this.entries.has(name);
  }

  namedItem(name) {
    this.namedCalls.push(name);
    return this.entries.get(name) ?? null;
  }
};
