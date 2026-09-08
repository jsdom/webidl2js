"use strict";

exports.implementation = class CircularParentImpl {
  accept(child) {
    this.child = child;
  }
};
