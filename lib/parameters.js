"use strict";

const conversions = require("webidl-conversions");

const utils = require("./utils");

module.exports.generateConversions = function (overloads) {
  let str = ``;
  let maxConstructor = overloads[0];
  let maxArguments = overloads[0].nameList.length;
  let isVariadic = false;

  for (let i = 1; i < overloads.length; ++i) {
    if (overloads[i].nameList.length > maxConstructor.nameList.length) {
      maxConstructor = overloads[i];
    }
    if (overloads[i].nameList.length > maxArguments) {
      maxArguments = overloads[i].nameList.length;
    }
    if (overloads[i].optionalityList.indexOf("variadic") !== -1) {
      isVariadic = true;
    }
  }

  const typeConversions = [];

  argumentLoop:
  for (let i = 0; i < maxArguments; ++i) {
    let maybeType = null;
    for (let j = 0; j < overloads.length; ++j) {
      if (overloads[j].optionalityList[i] !== "required") {
        break argumentLoop;
      }

      const thisType = overloads[j].operation.arguments[i].idlType;
      if (maybeType === null) {
        maybeType = thisType;
      } else if (maybeType.idlType !== thisType.idlType || maybeType.array !== thisType.array) {
        maybeType = null;
        break;
      }
    }

    typeConversions.push(maybeType);
  }

  str += `
  const args = [];
  for (let i = 0; i < arguments.length`;
  if (!isVariadic) {
    str += ` && i < ${maxArguments}`;
  }
  str += `; ++i) {
    args[i] = arguments[i];
  }`;
  for (let i = 0; i < typeConversions.length; ++i) {
    const typeConversion = typeConversions[i];
    if (typeConversion === null) {
      continue;
    }

    if (conversions[typeConversion.idlType]) {
      const argAttrs = maxConstructor.operation.arguments[i].extAttrs;
      const enforceRange = utils.hasExtAttr(argAttrs, "EnforceRange");
      const clamp = utils.hasExtAttr(argAttrs, "Clamp");

      let optString = "";
      if (clamp) {
        optString = `, { clamp: true }`;
      } else if (enforceRange) {
        optString = `, { enforceRange: true }`;
      }

      if (typeConversion.array) {
        str += `
  for (let i = 0; i < args[${i}].length; ++i) {
    args[${i}][i] = conversions["${typeConversion.idlType}"](args[${i}][i]${optString});
  }`;
      } else {
        str += `
  args[${i}] = conversions["${typeConversion.idlType}"](args[${i}]${optString});`;
      }
    }
  }

  return str;
};
