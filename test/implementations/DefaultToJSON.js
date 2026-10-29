"use strict";

exports.implementation = class DefaultToJSONImpl {
  constructor() {
    this.x = 1;
    this.enabled = true;
    this.label = null;
    this.payload = { value: "payload" };
    this.nested = null;
    this.choice = "choice";
    this.names = Object.freeze(["one", "two"]);
    this.ignored = "not serialized";
    this.promise = Promise.resolve("not serialized");
    this.handler = () => {};
    this.nonJSONUnion = "not serialized";
    this.workerOnly = 2;
  }
};
