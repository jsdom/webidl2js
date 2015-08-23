"use strict";

const conversions = require("webidl-conversions");

module.exports.generateConversions = function (overloads) {
  let str = ``;
  let minConstructor = overloads[0];
  let maxArguments = overloads[0].nameList.length;
  let isVariadic = false;

  for (let i = 1; i < overloads.length; ++i) {
    if (overloads[i].nameList.length < minConstructor.nameList.length) {
      minConstructor = overloads[i];
    }
    if (overloads[i].nameList.length > maxArguments) {
      maxArguments = overloads[i].nameList.length;
    }
    if (overloads[i].optionalityList.indexOf("variadic") !== -1) {
      isVariadic = true;
    }
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

  const handlingOverload = overloads[0].operation;
  const args = handlingOverload.arguments;
  for (let i = 0; i < args.length; ++i) {
    const arg = args[i];
    if (conversions[arg.idlType.idlType]) {
      if (arg.idlType.array) {
        str += `
    for (let i = 0; i < args[${i}].length; ++i) {
      args[${i}][i] = conversions["${arg.idlType.idlType}"](args[${i}][i]);
    }`;
      } else {
        str += `
    args[${i}] = conversions["${arg.idlType.idlType}"](args[${i}]);`;
      }
    }
  }

  return str;
};
