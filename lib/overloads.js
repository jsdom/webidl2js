"use strict";

module.exports.getEffectiveOverloads = function (A, N, I, C) {
  const S = [];
  let F = null;

  if (A === 'constructor') { // let's hope no-one specs a member named "constructor"
    F = I.extAttrs
      .filter(function (a) { return a.name === 'Constructor'; });
    F.forEach(function (c) { if (!c.arguments) { c.arguments = []; }});
  } else if (typeof A === "string") {
    F = I.members
      .filter(function (m) {
        return m.name === A || (A === "toString" && m.stringifier);
      });
    F.forEach(function (m) { if (m.stringifier) { m.arguments = []; }});
  }

  let maxArgs = 0;
  for (const X of F) {
    if (X.arguments.length > maxArgs) {
      maxArgs = X.arguments.length;
    }
  }

  const m = Math.max(maxArgs, N);
  for (const X of F) {
    const n = X.arguments.length;
    const nameList = X.arguments.map(function (arg) { return arg.name; });
    const typeList = X.arguments.map(function (arg) { return arg.idlType.idlType; });
    const optionalityList = X.arguments.map(function (arg) {
      if (arg.optional) return "optional";
      if (arg.variadic) return "variadic";
      return "required";
    });

    S.push({
      operation: X,
      nameList: nameList,
      typeList: typeList,
      optionalityList: optionalityList
    });

    if (optionalityList[optionalityList.length - 1] === "variadic") {
      S.push({
        operation: X,
        nameList: nameList.slice(0, -1),
        typeList: typeList.slice(0, -1),
        optionalityList: optionalityList.slice(0, -1)
      });
      //TODO: Handle variadic arguments better
    }

    for (let i = n - 1; i >= 0; --i) {
      if (optionalityList[i] === "required") break;
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
