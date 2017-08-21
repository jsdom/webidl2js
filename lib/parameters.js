"use strict";

const Overloads = require("./overloads");
const Types = require("./types");

const utils = require("./utils");

function generateVarConversion(ctx, name, conversion, argAttrs, ...typeArgs) {
  const { customTypes } = ctx;
  const requires = new utils.RequiresMap(ctx);
  let str = "";
  const idlType = conversion.type;

  // Always (try to) force-convert dictionaries
  const optional = conversion.optional && customTypes.get(idlType.idlType) !== "dictionary";
  if (optional) {
    str += `
      if (${name} !== undefined) {
    `;
  }

  const conv = Types.generateTypeConversion(ctx, name, idlType, argAttrs, ...typeArgs);
  requires.merge(conv.requires);
  str += conv.body;

  if (optional) {
    str += "}";
    if (conversion.default) {
      str += `
        else {
          ${name} = ${utils.getDefault(conversion.default)};
        }
      `;
    }
  }

  return {
    requires,
    body: str
  };
}

module.exports.generateOverloadConversions = function (ctx, overloads, parentName, errPrefix) {
  const requires = new utils.RequiresMap(ctx);
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
    str += `
      const args = [];
      for (let i = 0; i < arguments.length${extraClause}; ++i) {
        args[i] = arguments[i];
      }
    `;

    for (let i = 0; i < typeConversions.length; ++i) {
      if (typeConversions[i] === null) {
        continue;
      }

      // TODO: support overloaded variadic functions
      // We only want to support simple variadic functions right now. To determine that the current argument we are
      // processing is the variadic one, I present the following horrible hack, taking advantage of the fact that the
      // effective overload set we are currently producing always has a length of 2 for simple variadic functions (one
      // with the final variadic argument, one without). We don't know which overload has the variadic argument, so we
      // check both. This entire apparatus requires a rewrite for https://github.com/jsdom/webidl2js/issues/29.
      const curIsVariadic = i + 1 === maxArguments && overloads.length === 2 &&
                            (overloads[0].optionalityList[i] === "variadic" ||
                             overloads[1].optionalityList[i] === "variadic");
      let msg = `"${errPrefix}parameter ${i + 1}"`;
      let lvalue = `args[${i}]`;

      if (curIsVariadic) {
        msg = `"${errPrefix}parameter " + (i + 1)`;
        lvalue = `args[i]`;
        str += `for (let i = ${i}; i < arguments.length; ++i) {`;

        // The object will not be re-used outside of this function, so mutating it is fine here.
        typeConversions[i].optional = false;
      }

      const conv = generateVarConversion(
        ctx, lvalue, typeConversions[i], maxConstructor.operation.arguments[i].extAttrs, parentName, msg);
      requires.merge(conv.requires);
      str += conv.body;

      if (curIsVariadic) {
        str += "}";
      }
    }
  }
  return {
    requires,
    body: str,
    hasArgs: !isAlwaysZeroArgs
  };
};
