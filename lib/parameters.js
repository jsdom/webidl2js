"use strict";

const Overloads = require("./overloads");
const Types = require("./types");

const utils = require("./utils");

function isOrIncludes(ctx, parent, predicate) {
  parent = Types.resolveType(ctx, parent);
  return predicate(parent) || parent.union && parent.idlType.some(predicate);
}

function generateVarConversion(ctx, overload, i, parent, errPrefix, targetIdx = i) {
  const requires = new utils.RequiresMap(ctx);
  const idlType = overload.typeList[i];
  // Always (try to) force-convert dictionaries
  const optional = overload.optionalityList[i] === "optional" && !ctx.dictionaries.has(idlType.idlType);
  let str = `{ let curArg = arguments[${targetIdx}];`;
  if (optional) {
    str += `
      if (curArg !== undefined) {
    `;
  }
  const msg = typeof targetIdx === "string" ?
    `"${errPrefix}parameter " + (${targetIdx} + 1)` : `"${errPrefix}parameter ${i + 1}"`;
  const conv = Types.generateTypeConversion(
    ctx, "curArg", idlType, [], parent.name, msg);
  requires.merge(conv.requires);
  str += conv.body;
  if (optional) {
    str += "}";
    const defaultValue = overload.operation.arguments[i].default;
    if (defaultValue) {
      str += `
        else {
          curArg = ${utils.getDefault(defaultValue)};
        }
      `;
    }
  }
  str += "args.push(curArg);";
  str += "}";
  return {
    requires,
    body: str
  };
}

module.exports.generateOverloadConversions = function (ctx, typeOfOp, name, parent, errPrefix) {
  const requires = new utils.RequiresMap(ctx);
  const ops = Overloads.getOperations(typeOfOp, name, parent);
  const argLengths = Overloads.getEffectiveOverloads(typeOfOp, name, 0, parent).map(o => o.typeList.length);
  const maxArgs = Math.max(...argLengths);
  let str = "";
  if (maxArgs > 0) {
    const minArgs = Math.min(...argLengths);
    if (minArgs > 0) {
      const plural = minArgs > 1 ? "s" : "";
      str += `
        if (arguments.length < ${minArgs}) {
          throw new TypeError("${errPrefix}${minArgs} argument${plural} required, but only " + arguments.length +
                              " present.");
        }
      `;
    }
    str += "const args = [];";
    const switchCases = [];
    // Special case: when the operation isn't overloaded, always try to convert to the maximum number of args.
    for (let numArgs = ops.length === 1 ? maxArgs : minArgs; numArgs <= maxArgs; numArgs++) {
    // for (let numArgs = minArgs; numArgs <= maxArgs; numArgs++) {
      const S = Overloads.getEffectiveOverloads(typeOfOp, name, numArgs, parent)
        .filter(o => o.typeList.length === numArgs);
      if (S.length === 0) {
        switchCases.push(`
          throw new TypeError("${errPrefix}only " + arguments.length + " arguments present.");
        `);
        continue;
      }

      let d = -1;
      if (S.length > 1) {
        d = Overloads.distinguishingArgumentIndex(ctx, S);
      }
      let caseSrc = "";
      let i = 0;
      for (; i < d; i++) {
        const conv = generateVarConversion(ctx, S[0], i, parent, errPrefix);
        requires.merge(conv.requires);
        caseSrc += conv.body;
      }
      if (i === d) {
        caseSrc += "{";
        caseSrc += `let curArg = arguments[${d}];`;
        const possibilities = [];

        const optionals = S.filter(o => o.optionalityList[d] === "optional");
        if (optionals.length) {
          possibilities.push(`
            if (curArg === undefined) {
              ${continued(optionals[0], i)}
            }
          `);
        }

        const nullables = S.filter(o => {
          return isOrIncludes(ctx, o.typeList[d], t => t.nullable || ctx.dictionaries.has(t.idlType));
        });
        if (nullables.length) {
          possibilities.push(`
            if (curArg === null || curArg === undefined) {
              ${continued(nullables[0], i)}
            }
          `);
        }

        const interfaceTypes = new Map();
        for (const o of S) {
          const type = Types.resolveType(ctx, o.typeList[d]);
          if (ctx.interfaces.has(type.idlType)) {
            interfaceTypes.set(type.idlType, o);
          } else if (type.union) {
            for (const child of type.idlType) {
              if (ctx.interfaces.has(child.idlType)) {
                interfaceTypes.set(child.idlType, o);
              }
            }
          }
        }
        for (const [iface, overload] of interfaceTypes) {
          let fn;
          // Avoid requiring the interface itself
          if (iface !== parent.name) {
            fn = `${iface}.is`;
            requires.addRelative(iface);
          } else {
            fn = "exports.is";
          }
          possibilities.push(`
            if (${fn}(curArg)) {
              ${continued(overload, i)}
            }
          `);
        }

        const arrayBuffers = S.filter(o => isOrIncludes(ctx, o.typeList[d], t => t.idlType === "ArrayBuffer"));
        if (arrayBuffers.length) {
          possibilities.push(`
            if (utils.isArrayBuffer(curArg)) {
              ${continued(arrayBuffers[0], i)}
            }
          `);
        }

        const arrayBufferViews = new Map();
        for (const o of S) {
          const type = Types.resolveType(ctx, o.typeList[d]);
          if (Types.arrayBufferViewTypes.has(type.idlType)) {
            arrayBufferViews.set(type.idlType, o);
          } else if (type.union) {
            for (const child of type.idlType) {
              if (Types.arrayBufferViewTypes.has(child.idlType)) {
                arrayBufferViews.set(child.idlType, o);
              }
            }
          }
        }
        if (arrayBufferViews.size) {
          // Special case for all ArrayBufferView types.
          if (arrayBufferViews.size === Types.arrayBufferViewTypes.size &&
              new Set(arrayBufferViews.values()).size === 1) {
            possibilities.push(`
              if (ArrayBuffer.isView(curArg)) {
                ${continued(arrayBufferViews.get("Uint8Array"), i)}
              }
            `);
          } else {
            for (const [type, overload] of arrayBufferViews) {
              possibilities.push(`
                if (ArrayBuffer.isView(curArg) && curArg instanceof ${type}) {
                  ${continued(overload, i)}
                }
              `);
            }
          }
        }

        const callables = S.filter(o => {
          return isOrIncludes(ctx, o.typeList[d], t => ["Function", "VoidFunction"].includes(t.idlType));
        });
        if (callables.length) {
          possibilities.push(`
            if (typeof curArg === "function") {
              ${continued(callables[0], i)}
            }
          `);
        }

        const iterables = S.filter(o => {
          return isOrIncludes(ctx, o.typeList[d], t => ["sequence", "FrozenArray"].includes(t.generic));
        });
        if (iterables.length) {
          possibilities.push(`
            if (utils.isObject(curArg) && typeof curArg[Symbol.iterator] === "function") {
              ${continued(iterables[0], i)}
            }
          `);
        }

        const objects = S.filter(o => isOrIncludes(ctx, o.typeList[d], t => t.idlType === "object"));
        if (objects.length) {
          possibilities.push(`
            if (utils.isObject(curArg)) {
              ${continued(objects[0], i)}
            }
          `);
        }

        const booleans = S.filter(o => isOrIncludes(ctx, o.typeList[d], t => t.idlType === "boolean"));
        if (booleans.length) {
          possibilities.push(`
            if (typeof curArg === "boolean") {
              ${continued(booleans[0], i)}
            }
          `);
        }

        const numerics = S.filter(o => isOrIncludes(ctx, o.typeList[d], t => Types.numericTypes.has(t.idlType)));
        if (numerics.length) {
          possibilities.push(`
            if (typeof curArg === "number") {
              ${continued(numerics[0], i)}
            }
          `);
        }

        const strings = S.filter(o => {
          return isOrIncludes(ctx, o.typeList[d], t => {
            return Types.stringTypes.has(t.idlType) || ctx.enumerations.has(t.idlType);
          });
        });
        const any = S.filter(o => isOrIncludes(ctx, o.typeList[d], t => t.idlType === "any"));
        if (strings.length) {
          possibilities.push(`{ ${continued(strings[0], i)} }`);
        } else if (numerics.length) {
          possibilities.push(`{ ${continued(numerics[0], i)} }`);
        } else if (booleans.length) {
          possibilities.push(`{ ${continued(booleans[0], i)} }`);
        } else if (any.length) {
          possibilities.push(`{ ${continued(any[0], i)} }`);
        } else {
          possibilities.push(`throw new TypeError("${errPrefix}No such overload");`);
        }

        caseSrc += possibilities.join(" else ");

        caseSrc += "}";
      } else {
        // Branch taken when S.length === 1.
        caseSrc += continued(S[0], i);
      }
      switchCases.push(caseSrc);

      function continued(overload, idx) {
        let continuedStr = "";
        for (; idx < numArgs; idx++) {
          let targetIdx = idx;
          if (overload.optionalityList[idx] === "variadic" && numArgs === maxArgs && idx === numArgs - 1) {
            continuedStr += `for (let i = ${idx}; i < arguments.length; i++)`;
            targetIdx = "i";
          }
          const conv = generateVarConversion(ctx, overload, idx, parent, errPrefix, targetIdx);
          requires.merge(conv.requires);
          continuedStr += conv.body;
        }
        return continuedStr;
      }
    }
    if (switchCases.length === 1) {
      str += switchCases[0];
    } else {
      str += "switch (arguments.length) {";
      let lastBody;
      for (let i = 0; i < switchCases.length - 1; i++) {
        if (lastBody !== undefined && switchCases[i] !== lastBody) {
          str += lastBody + "break;";
        }
        str += `case ${minArgs + i}:`;
        lastBody = switchCases[i];
      }
      if (lastBody !== undefined && switchCases[switchCases.length - 1] !== lastBody) {
        str += lastBody + "break;";
      }
      str += "default:";
      str += switchCases[switchCases.length - 1];
      str += "}";
    }
  }

  return {
    requires,
    body: str,
    hasArgs: maxArgs > 0
  };
};
