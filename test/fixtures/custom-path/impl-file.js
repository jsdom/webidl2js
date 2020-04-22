"use strict";

exports.implementation = class FooImpl {
  constructor(globalObject, args, privateData) {
    this._globalObject = globalObject;
    this._args = args;
    this._privateData = privateData;
  }
};
