"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const URL = require("./URL.js");
const Dictionary = require("./Dictionary.js");

exports._convertInherit = (globalObject, obj, ret, { context = "The provided value" } = {}) => {
  Dictionary._convertInherit(globalObject, obj, ret, { context });

  {
    const key = "alpha";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["DOMString"](value, {
        context: `${context}'s 'alpha' member`,
        globals: globalObject,
      });

      ret[key] = value;
    } else {
      ret[key] = "partial";
    }
  }

  {
    const key = "empty";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      if (!utils.isObject(value)) {
        throw new globalObject.TypeError(`${context}'s 'empty' member is not an iterable object.`);
      } else {
        const V = [];
        const tmp = value;
        for (let nextItem of tmp) {
          nextItem = conversions["DOMString"](nextItem, {
            context: `${context}'s 'empty' member's element`,
            globals: globalObject,
          });

          V.push(nextItem);
        }
        value = V;
      }

      ret[key] = value;
    } else {
      ret[key] = [];
    }
  }

  {
    const key = "negativeInfinity";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["unrestricted double"](value, {
        context: `${context}'s 'negativeInfinity' member`,
        globals: globalObject,
      });

      ret[key] = value;
    } else {
      ret[key] = -Infinity;
    }
  }

  {
    const key = "notANumber";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["unrestricted double"](value, {
        context: `${context}'s 'notANumber' member`,
        globals: globalObject,
      });

      ret[key] = value;
    } else {
      ret[key] = NaN;
    }
  }

  {
    const key = "nullable";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      if (value === null || value === undefined) {
        value = null;
      } else {
        value = URL.convert(globalObject, value, { context: `${context}'s 'nullable' member` });
      }
      ret[key] = value;
    } else {
      ret[key] = null;
    }
  }

  {
    const key = "number";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["long"](value, {
        context: `${context}'s 'number' member`,
        globals: globalObject,
      });

      ret[key] = value;
    } else {
      ret[key] = 42;
    }
  }

  {
    const key = "positiveInfinity";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["unrestricted double"](value, {
        context: `${context}'s 'positiveInfinity' member`,
        globals: globalObject,
      });

      ret[key] = value;
    } else {
      ret[key] = Infinity;
    }
  }

  {
    const key = "zebra";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = conversions["boolean"](value, {
        context: `${context}'s 'zebra' member`,
        globals: globalObject,
      });

      ret[key] = value;
    } else {
      ret[key] = true;
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
