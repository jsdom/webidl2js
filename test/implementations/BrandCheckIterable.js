"use strict";

const utils = require("../output/utils.js");

exports.implementation = class BrandCheckIterableImpl {
  constructor(globalObject, args, { values }) {
    this.values = values;
    this.positions = new WeakMap();
    this.calls = [];
  }

  [Symbol.iterator]() {
    return this.values[Symbol.iterator]();
  }

  [utils.asyncIteratorInit](iterator, [offset]) {
    this.offset = offset;
    this.positions.set(iterator, offset);
  }

  [utils.asyncIteratorNext](iterator) {
    this.calls.push("next");
    const index = this.positions.get(iterator);
    this.positions.set(iterator, index + 1);
    return Promise.resolve(index < this.values.length ? this.values[index] : utils.asyncIteratorEOI);
  }

  [utils.asyncIteratorReturn](iterator, value) {
    this.calls.push("return");
    this.returnValue = value;
    this.positions.delete(iterator);
    return Promise.resolve();
  }
};
