"use strict";

const conversions = require("webidl-conversions");
const Overloads = require("./overloads");

const utils = require("./utils");

module.exports.generateVarConversion = function (name, conversion, argAttrs, customTypes) {
  const requires = {};
  let str = "";
  const idlType = conversion.type;

  if (conversions[idlType.idlType] || customTypes.has(idlType.idlType)) {
    const enforceRange = utils.getExtAttr(argAttrs, "EnforceRange");
    const clamp = utils.getExtAttr(argAttrs, "Clamp");
    const treatNullAs = utils.getExtAttr(argAttrs, "TreatNullAs");

    let optString = "";
    if (clamp) {
      optString = `, { clamp: true }`;
    } else if (enforceRange) {
      optString = `, { enforceRange: true }`;
    } else if (treatNullAs && treatNullAs.rhs.value === "EmptyString") {
      optString = `, { treatNullAsEmptyString: true }`;
    }

    let conversionFn = null;
    if (conversions[idlType.idlType]) {
      conversionFn = `conversions["${idlType.idlType}"]`;
    } else {
      requires[`convert${idlType.idlType}`] = `require("./${idlType.idlType}").convert`;
      conversionFn = `convert${idlType.idlType}`;
    }
    if (conversion.optional) {
      str += `
  if (${name} !== undefined) {`;
    }
    if (idlType.array) {
      str += `
  for (let i = 0; i < ${name}.length; ++i) {
    ${name}[i] = ${conversionFn}(${name}[i]${optString});
  }`;
    } else {
      str += `
  ${name} = ${conversionFn}(${name}${optString});`;
    }
    if (conversion.optional) {
      str += `
  }`;
    }
  }

  return {
    requires,
    body: str
  };
};

module.exports.generateOverloadConversions = function (overloads, customTypes) {
  const requires = {};
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

    const conv = module.exports.generateVarConversion(`args[${i}]`, typeConversions[i], maxConstructor.operation.arguments[i].extAttrs, customTypes);
    Object.assign(requires, conv.requires);
    str += conv.body;
  }
  return {
    requires,
    body: str
  };
};
