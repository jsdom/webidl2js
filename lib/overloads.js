"use strict";

const { areDistinguishable, sameType } = require("./types");

function getOperations(type, A, I) {
  switch (type) {
    case "regular operation":
      return I.operations.get(A).idls;
    case "static operation":
      return I.staticOperations.get(A).idls;
    case "constructor": {
      return I.constructorOperations;
    }
  }
  throw new RangeError(`${type}s are not yet supported`);
}
module.exports.getOperations = getOperations;

module.exports.getEffectiveOverloads = function (type, A, N, I) {
  const S = [];
  const F = getOperations(type, A, I);
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
    const typeList = X.arguments.map(arg => arg.idlType);
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

module.exports.distinguishingArgumentIndex = function (ctx, S) {
  for (let i = 0; i < S[0].typeList.length; i++) {
    let distinguishable = true;
    for (let j = 0; j < S.length - 1; j++) {
      for (let k = j + 1; k < S.length; k++) {
        if (!areDistinguishable(ctx, S[j].typeList[i], S[k].typeList[i])) {
          distinguishable = false;
        }
      }
    }
    if (distinguishable) {
      return i;
    }

    for (let j = 0; j < S.length - 1; j++) {
      for (let k = j + 1; k < S.length; k++) {
        if (!sameType(ctx, S[j].typeList[i], S[k].typeList[i])) {
          throw new Error(`Different but indistinguishable types at index ${i}`);
        }
      }
    }
  }

  return -1;
};
