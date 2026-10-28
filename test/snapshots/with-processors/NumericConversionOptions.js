"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

exports._convertInherit = (globalObject, obj, ret, { context = "The provided value" } = {}) => {
  {
    const key = "clamped";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["octet"](value, {
        context: `${context} has member 'clamped' that`,
        globals: globalObject,
        clamp: true,
      });

      ret[key] = value;
    }
  }

  {
    const key = "ranged";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["unsigned short"](value, {
        context: `${context} has member 'ranged' that`,
        globals: globalObject,
        enforceRange: true,
      });

      ret[key] = value;
    }
  }

  {
    const key = "typedefClamped";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["unsigned short"](value, {
        context: `${context} has member 'typedefClamped' that`,
        globals: globalObject,
        clamp: true,
      });

      ret[key] = value;
    }
  }

  {
    const key = "typedefRanged";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["unsigned long"](value, {
        context: `${context} has member 'typedefRanged' that`,
        globals: globalObject,
        enforceRange: true,
      });

      ret[key] = value;
    }
  }
};

exports.convert = (globalObject, obj, { context = "The provided value" } = {}) => {
  if (obj !== undefined && typeof obj !== "object" && typeof obj !== "function") {
    throw new globalObject.TypeError(`${context} is not an object.`);
  }

  const ret = Object.create(null);
  exports._convertInherit(globalObject, obj, ret, { context });
  return ret;
};
