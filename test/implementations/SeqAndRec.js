"use strict";

class SeqAndRecImpl {
  constructor(args) {}

  recordConsumer(record) {
    console.assert(Object.getPrototypeOf(record) === null);
    for (const name in record)
      console.log(name, JSON.stringify(record[name]));
  }

  recordConsumer2(record) {
    return this.recordConsumer(record);
  }

  sequenceConsumer(arr) {
    console.assert(Array.isArray(arr));
    for (const item of arr)
      console.log(JSON.stringify(item));
  }

  sequenceConsumer2(arr) {
    return this.sequenceConsumer(arr);
  }
}

module.exports = {
  implementation: SeqAndRecImpl
};
