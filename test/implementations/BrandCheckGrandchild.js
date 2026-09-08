"use strict";

exports.implementation = class BrandCheckGrandchildImpl {
  constructor() {
    this.value = "grandchild";
  }

  parentMethod() {
    return `parent:${this.value}`;
  }

  childMethod() {
    return `child:${this.value}`;
  }

  grandchildMethod() {
    return `grandchild:${this.value}`;
  }
};
