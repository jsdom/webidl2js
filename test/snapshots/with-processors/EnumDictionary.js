"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const RequestDestination = require("./RequestDestination.js");
const EscapedEnum = require("./EscapedEnum.js");

exports._convertInherit = (globalObject, obj, ret, { context = "The provided value" } = {}) => {
  {
    const key = "destination";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = RequestDestination.convert(globalObject, value, {
        context: `${context}'s 'destination' member`,
      });

      ret[key] = value;
    }
  }

  {
    const key = "destinations";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      if (!utils.isObject(value)) {
        throw new globalObject.TypeError(
          `${context}'s 'destinations' member is not an iterable object.`,
        );
      } else {
        const V = [];
        const tmp = value;
        for (let nextItem of tmp) {
          nextItem = RequestDestination.convert(globalObject, nextItem, {
            context: `${context}'s 'destinations' member's element`,
          });

          V.push(nextItem);
        }
        value = V;
      }

      ret[key] = value;
    }
  }

  {
    const key = "destinationsByName";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      if (!utils.isObject(value)) {
        throw new globalObject.TypeError(
          `${context}'s 'destinationsByName' member is not an object.`,
        );
      } else {
        const result = Object.create(null);
        for (const key of Reflect.ownKeys(value)) {
          const desc = Object.getOwnPropertyDescriptor(value, key);
          if (desc && desc.enumerable) {
            let typedKey = key;

            typedKey = conversions["DOMString"](typedKey, {
              context: `${context}'s 'destinationsByName' member's key`,
              globals: globalObject,
            });

            let typedValue = value[key];

            typedValue = RequestDestination.convert(globalObject, typedValue, {
              context: `${context}'s 'destinationsByName' member's value`,
            });

            result[typedKey] = typedValue;
          }
        }
        value = result;
      }

      ret[key] = value;
    }
  }

  {
    const key = "escaped";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      value = EscapedEnum.convert(globalObject, value, {
        context: `${context}'s 'escaped' member`,
      });

      ret[key] = value;
    }
  }

  {
    const key = "nullableDestination";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      if (value === null || value === undefined) {
        value = null;
      } else {
        value = RequestDestination.convert(globalObject, value, {
          context: `${context}'s 'nullableDestination' member`,
        });
      }
      ret[key] = value;
    }
  }

  {
    const key = "unionDestination";
    let value = obj === undefined || obj === null ? undefined : obj[key];
    if (value !== undefined) {
      if (typeof value === "number") {
        value = conversions["long"](value, {
          context: `${context}'s 'unionDestination' member`,
          globals: globalObject,
        });
      } else {
        value = RequestDestination.convert(globalObject, value, {
          context: `${context}'s 'unionDestination' member`,
        });
      }
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
