"use strict";

exports.implementation = class ExternalOperationsImpl {
  static create(globalObject) {
    return require("../../output/external-base/ExternalOperations.js").createImpl(globalObject);
  }

  get value() {
    return "base";
  }
};
