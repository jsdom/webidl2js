"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const URL = require("./URL.js");
const URLSearchParams = require("./URLSearchParams.js");

exports._convertInherit = (globalObject, obj, ret, { context = "The provided value" } = {}) => {
  {
    const key = "boolWithDefault";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["boolean"](value, {
        context: `${context}'s 'boolWithDefault' member`,
        globals: globalObject,
      });

      ret[key] = value;
    } else {
      ret[key] = false;
    }
  }

  {
    const key = "requiredInterface";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = URL.convert(globalObject, value, {
        context: `${context}'s 'requiredInterface' member`,
      });

      ret[key] = value;
    } else {
      throw new globalObject.TypeError("requiredInterface is required in 'Dictionary'");
    }
  }

  {
    const key = "seq";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      if (!utils.isObject(value)) {
        throw new globalObject.TypeError(`${context}'s 'seq' member is not an iterable object.`);
      } else {
        const V = [];
        const tmp = value;
        for (let nextItem of tmp) {
          nextItem = URLSearchParams.convert(globalObject, nextItem, {
            context: `${context}'s 'seq' member's element`,
          });

          V.push(nextItem);
        }
        value = V;
      }

      ret[key] = value;
    }
  }

  {
    const key = "vanillaString";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["DOMString"](value, {
        context: `${context}'s 'vanillaString' member`,
        globals: globalObject,
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
