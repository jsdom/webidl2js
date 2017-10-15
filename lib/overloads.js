"use strict";

module.exports.getEffectiveOverloads = function (type, A, N, I) {
  const S = [];
  let F = null;

  switch (type) {
    case "regular operation":
      F = I.operations.get(A).idls;
      break;
    case "static operation":
      F = I.staticOperations.get(A).idls;
      break;
    case "constructor":
      F = I.idl.extAttrs.filter(a => a.name === "Constructor");
      for (const c of F) {
        if (!c.arguments) {
          c.arguments = [];
        }
      }
      break;
    default:
      throw new RangeError(`${type}s are not yet supported`);
  }

  let maxArgs = 0;
  for (const X of F) {
    if (X.arguments.length > maxArgs) {
      maxArgs = X.arguments.length;
    }
  }

  const max = Math.max(maxArgs, N);
  for (const X of F) {
    const n = X.arguments.length;
    const nameList = X.arguments.map(arg => arg.name);
    const typeList = X.arguments.map(arg => arg.idlType.idlType);
    const optionalityList = X.arguments.map(arg => {
      if (arg.optional) {
        return "optional";
      }
      if (arg.variadic) {
        return "variadic";
      }
      return "required";
    });

    S.push({
      operation: X,
      nameList,
      typeList,
      optionalityList
    });

    if (optionalityList[optionalityList.length - 1] === "variadic") {
      for (let i = n; i <= max - 1; i++) {
        const variadicNames = nameList.slice(0, n);
        const variadicTypes = typeList.slice(0, n);
        const variadicOptionalityValues = optionalityList.slice(0, n);
        for (let j = n; j <= i; j++) {
          variadicNames.push(nameList[n - 1]);
          variadicTypes.push(typeList[n - 1]);
          variadicOptionalityValues.push("variadic");
        }
        S.push({
          operation: X,
          nameList: variadicNames,
          typeList: variadicTypes,
          optionalityList: variadicOptionalityValues
        });
      }
    }

    for (let i = n - 1; i >= 0; --i) {
      if (optionalityList[i] === "required") {
        break;
      }
      S.push({
        operation: X,
        nameList: nameList.slice(0, i),
        typeList: typeList.slice(0, i),
        optionalityList: optionalityList.slice(0, i)
      });
    }
  }

  return S;
};

module.exports.proveSimiliarity = function (ctx, overloads) {
  let maxArguments = overloads[0].nameList.length;
  for (let i = 1; i < overloads.length; ++i) {
    if (overloads[i].nameList.length > maxArguments) {
      maxArguments = overloads[i].nameList.length;
    }
  }

  const typeConversions = [];
  for (let i = 0; i < maxArguments; ++i) {
    if (overloads[0].operation.arguments.length <= i) {
      break;
    }

    let maybeType = {
      type: overloads[0].operation.arguments[i].idlType,
      optional: overloads[0].optionalityList[i] !== "required",
      default: overloads[0].operation.arguments[i].default
    };
    for (let j = 1; j < overloads.length; ++j) {
      if (overloads[j].optionalityList[i] !== "required") {
        maybeType.optional = true;
      }

      const thisType = overloads[j].operation.arguments[i].idlType;
      if (maybeType.type.idlType !== thisType.idlType || maybeType.type.array !== thisType.array ||
          maybeType.default !== overloads[j].operation.arguments[i].default) {
        maybeType = null;
        break;
      }
    }

    typeConversions.push(maybeType);
  }

  return typeConversions;
};
