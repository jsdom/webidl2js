"use strict";

const allExports = Object.create(null);
exports.bootstrap = function (globalName, globalObj, defaultPrivateData) {
  const exportsWithFactories = Object.assign(Object.create(null), allExports);
  for (const name of Object.keys(exportsWithFactories)) {
    const obj = exportsWithFactories[name];
    if (typeof obj.expose === "function") {
      obj.expose(globalName, globalObj);
    } else if (typeof obj.createInterface === "function") {
      const iface = obj.createInterface(defaultPrivateData);
      // Mix in is()/isImpl().
      Object.assign(iface, obj);
      exportsWithFactories[name] = iface;
      iface.expose(globalName, globalObj);
    }
  }
  return exportsWithFactories;
};

// Below this line, exports will be added.
