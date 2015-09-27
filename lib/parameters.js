"use strict";

const conversions = require("webidl-conversions");
const Overloads = require("./overloads");

const utils = require("./utils");

module.exports.generateConversions = function (overloads, customTypes) {
  let prefix = ``;
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

  const typeConversions = Overloads.proveSimiliarity(overloads);

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
    if (typeConversions[i] === null) {
      continue;
    }

    const idlType = typeConversions[i].type;
    if (conversions[idlType.idlType] || customTypes.has(idlType.idlType)) {
      const argAttrs = maxConstructor.operation.arguments[i].extAttrs;
      const enforceRange = utils.hasExtAttr(argAttrs, "EnforceRange");
      const clamp = utils.hasExtAttr(argAttrs, "Clamp");

      let optString = "";
      if (clamp) {
        optString = `, { clamp: true }`;
      } else if (enforceRange) {
        optString = `, { enforceRange: true }`;
      }

      let conversionFn = null;
      if (conversions[idlType.idlType]) {
        conversionFn = `conversions["${idlType.idlType}"]`;
      } else {
        prefix += `const convert${idlType.idlType} = require("./${idlType.idlType}").convert;\n`;
        conversionFn = `convert${idlType.idlType}`;
      }
      if (typeConversions[i].optional) {
        str += `
  if (args[${i}] !== undefined) {`;
      }
      if (idlType.array) {
        str += `
  for (let i = 0; i < args[${i}].length; ++i) {
    args[${i}][i] = ${conversionFn}(args[${i}][i]${optString});
  }`;
      } else {
        str += `
  args[${i}] = ${conversionFn}(args[${i}]${optString});`;
      }
      if (typeConversions[i].optional) {
        str += `
  }`;
      }
    }
  }

  return {
    prefix,
    body: str
  };
};
