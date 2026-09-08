"use strict";

const { implementation: CircularParentImpl } = require("./CircularParent.js");

exports.implementation = class CircularChildImpl extends CircularParentImpl {};
