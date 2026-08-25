"use strict";

const utils = require("../output/utils.js");

exports.implementation = class URLListImpl {
  constructor(globalObject, constructorArgs, { values = [] }) {
    this._values = values;
  }

  get length() {
    return this._values.length;
  }

  [utils.supportsPropertyIndex](index) {
    return index < this.length;
  }

  item(index) {
    return this._values[index];
  }
};
