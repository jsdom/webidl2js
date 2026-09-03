"use strict";

exports.implementation = class BrandCheckImpl {
  constructor() {
    this._value = "";
  }

  get value() {
    return this._value;
  }

  set value(v) {
    this._value = v;
  }

  method() {
    return "called";
  }
};
