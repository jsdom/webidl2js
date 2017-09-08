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

      // For variadic operations, we only try to fully support non-overloaded variadic operations right now. It is a
      // TODO to support overloaded variadic functions. The decision to only support the simplest cases of variadic
      // operations is made, because overload resolution for overloaded variadic operations is non-trivial but hardly
      // used in the Web platform (or at least the jsdom-supported subset of it), and because the entire overload
      // resolution apparatus will require a rewrite for https://github.com/jsdom/webidl2js/issues/29.
      //
      // To determine that the current argument we are processing is the variadic one, the following three-fold
      // algorithm is used:
      //
      // 1. The current argument must the last one.
      // 2. The effective overload set must have a length of two (one with the final variadic argument, one without).
      // 3. The current argument must have an optionality value of "variadic" in either one of the overloads.
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
