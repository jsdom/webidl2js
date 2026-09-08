"use strict";

exports.implementation = class BrandCheckSiblingImpl {
  constructor() {
    this.value = "sibling";
  }

  parentMethod() {
    return `parent:${this.value}`;
  }

  siblingMethod() {
    return `sibling:${this.value}`;
  }
};
