"use strict";

const Overloads = require("./overloads");
const Types = require("./types");

const utils = require("./utils");

function getDefault(dflt) {
  switch (dflt.type) {
    case "boolean":
    case "number":
    case "string":
      return JSON.stringify(dflt.value);
    case "null":
    case "NaN":
      return dflt.type;
    case "Infinity":
      return `${dflt.negative ? "-" : ""}Infinity`;
    case "sequence":
      return "[]";
  }
  throw new Error("Unexpected default type: " + dflt.type);
}

function generateVarConversion(ctx, name, conversion, argAttrs, ...typeArgs) {
  const { customTypes } = ctx;
  const requires = {};
  let str = "";
  const idlType = conversion.type;

  if (conversion.optional && customTypes.get(idlType.idlType) !== "dictionary") { // always (try to) force-convert dictionaries
    str += `
if (${name} !== undefined) {`;
  }

  const conv = Types.generateTypeConversion(ctx, name, idlType, argAttrs, ...typeArgs);
  Object.assign(requires, conv.requires);
  str += conv.body;

  if (conversion.optional && customTypes.get(idlType.idlType) !== "dictionary") {
    str += `
}`;
    if (conversion.default) {
      str += ` else {
  ${name} = ${getDefault(conversion.default)};
}`;
    }
  }

  return {
    requires,
    body: str
  };
};

module.exports.generateOverloadConversions = function (ctx, overloads, parentName, errPrefix) {
  const { customTypes } = ctx;
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

  const typeConversions = Overloads.proveSimiliarity(ctx, overloads);

  const isAlwaysZeroArgs = !isVariadic && maxArguments === 0;
  if (!isAlwaysZeroArgs) {
    const extraClause = !isVariadic ? ` && i < ${maxArguments}` : ``;
    str += `\n
  const args = [];
  for (let i = 0; i < arguments.length${extraClause}; ++i) {
    args[i] = arguments[i];
  }`;

    for (let i = 0; i < typeConversions.length; ++i) {
      if (typeConversions[i] === null) {
        continue;
      }

      const conv = generateVarConversion(ctx, `args[${i}]`, typeConversions[i], maxConstructor.operation.arguments[i].extAttrs, parentName, `"${errPrefix}parameter ${i + 1}"`);
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
