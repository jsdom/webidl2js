"use strict";

exports.implementation = class HTMLCollectionImpl {
  constructor(globalObject, constructorArgs, { indexed = [], named = {} }) {
    this._indexed = indexed;
    this._named = named;
    this.indexedCalls = [];
    this.namedCalls = [];
  }

  get length() {
    return this._indexed.length;
  }

  item(index) {
    this.indexedCalls.push(index);
    return this._indexed[index] ?? null;
  }

  namedItem(name) {
    this.namedCalls.push(name);
    return this._named[name] ?? null;
  }
};
