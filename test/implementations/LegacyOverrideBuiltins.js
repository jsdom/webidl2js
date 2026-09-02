"use strict";

const utils = require("../output/utils.js");

exports.implementation = class LegacyOverrideBuiltinsImpl {
  constructor(globalObject, constructorArgs, { entries = {} }) {
    this._entries = entries;
  }

  [utils.supportsPropertyName](name) {
    return Object.hasOwn(this._entries, name);
  }

  [utils.namedGet](name) {
    return this._entries[name];
  }
};
