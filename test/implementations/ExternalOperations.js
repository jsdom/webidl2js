"use strict";

exports.implementation = class ExternalOperationsImpl {
  static currentGlobal(globalObject) {
    return globalObject;
  }

  static stringify(value) {
    return value;
  }
};
