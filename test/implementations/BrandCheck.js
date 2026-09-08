"use strict";

const utils = require("../output/utils.js");

exports.implementation = class BrandCheckImpl {
  constructor() {
    this.value = "initial";
  }

  parentMethod() {
    return `parent:${this.value}`;
  }

  childMethod() {
    return `child:${this.value}`;
  }

  shadow(value) {
    return `shadow:${value}`;
  }

  objectUnion(value) {
    this.lastObjectUnionValue = value;
  }
};

exports.init = impl => {
  impl.wrapperSeenDuringInit = utils.wrapperForImpl(impl);
};
