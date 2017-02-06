"use strict";

const Overloads = require("./overloads");
const Types = require("./types");

const utils = require("./utils");

module.exports.generateVarConversion = function (name, conversion, argAttrs, customTypes) {
  const requires = {};
  let str = "";
  const idlType = conversion.type;

  if (idlType.nullable) {
    str += `
  if (${name} === null || ${name} === undefined) {
    ${name} = null;
  } else {`;
  }

  if (Types.canHandleType(idlType, customTypes)) {
    if (conversion.optional && !customTypes.has(idlType.idlType)) { // always (try to) force-convert dictionaries
      str += `
  if (${name} !== undefined) {`;
    }

    const conv = Types.generateTypeConversion(name, idlType, argAttrs, customTypes);
    Object.assign(requires, conv.requires);
    str += conv.body;

    if (conversion.optional && !customTypes.has(idlType.idlType)) {
      str += `
  }`;
      if (conversion.default) {
        str += ` else {
    ${name} = ${JSON.stringify(conversion.default.value)};
  }`;
      }
    }
  }

  if (idlType.nullable) {
    str += `
  }`;
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
  let isVariadic = overloads[0].optionalityList.indexOf("variadic") !== -1;

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

  const isAlwaysZeroArgs = !isVariadic && maxArguments === 0;
  if (!isAlwaysZeroArgs) {
    const extraClause = !isVariadic ? ` && i < ${maxArguments}` : ``;
    str += `\n
  const args = [];
  for (let i = 0; i < arguments.length${extraClause}; ++i) {
    args[i] = utils.tryImplForWrapper(arguments[i]);
  }`;

    for (let i = 0; i < typeConversions.length; ++i) {
      if (typeConversions[i] === null) {
        continue;
      }

      const conv = module.exports.generateVarConversion(`args[${i}]`, typeConversions[i], maxConstructor.operation.arguments[i].extAttrs, customTypes);
      Object.assign(requires, conv.requires);
      str += conv.body;
    }
  }
  return {
    requires,
    body: str,
    hasArgs: !isAlwaysZeroArgs
  };
};
