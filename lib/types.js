"use strict";

const conversions = require("webidl-conversions");

const utils = require("./utils");

const typedArrayTypes = new Set([
  "Int8Array",
  "Int16Array",
  "Int32Array",
  "Uint8Array",
  "Uint16Array",
  "Uint32Array",
  "Uint8ClampedArray",
  "Float32Array",
  "Float64Array"
]);
const arrayBufferViewTypes = new Set([...typedArrayTypes, "DataView"]);
const bufferSourceTypes = new Set([...arrayBufferViewTypes, "ArrayBuffer"]);
const stringTypes = new Set(["DOMString", "ByteString", "USVString"]);
const integerTypes = new Set([
  "byte",
  "octet",
  "short",
  "unsigned short",
  "long",
  "unsigned long",
  "long long",
  "unsigned long long"
]);
const numericTypes = new Set([...integerTypes, "float", "unrestricted float", "double", "unrestricted double"]);

const resolvedMap = new WeakMap();

function mergeExtAttrs(a = [], b = []) {
  return [...a, ...b];
}

function mergeExtAttrsOfTypes(idlTypes) {
  const extAttrs = [];
  for (const idlType of idlTypes) {
    if (idlType.extAttrs !== undefined) {
      extAttrs.push(...idlType.extAttrs);
    }
  }
  return extAttrs;
}

// Types of types that generate an output file.
const resolvedTypes = new Set(["callback", "callback interface", "dictionary", "enumeration", "interface"]);

function resolveType(ctx, idlType, stack = []) {
  if (resolvedMap.has(idlType)) {
    return resolvedMap.get(idlType);
  }
  const original = idlType;
  idlType = deepClone(idlType);
  resolvedMap.set(original, idlType);

  if (idlType.union) {
    const types = [];
    for (let type of idlType.idlType) {
      type = resolveType(ctx, type, stack);
      idlType.nullable ||= type.nullable;
      // Only the outermost union is nullable
      type.nullable = false;
      if (type.union) {
        types.push(...type.idlType);
      } else {
        types.push(type);
      }
    }
    for (const type of types) {
      type.extAttrs = deepClone(mergeExtAttrs(type.extAttrs, idlType.extAttrs));
    }
    idlType.idlType = types;
    return idlType;
  } else if (idlType.generic) {
    idlType.idlType = idlType.idlType.map(t => resolveType(ctx, t, stack));
    return idlType;
  } else if (resolvedTypes.has(ctx.typeOf(idlType.idlType))) {
    // already resolved
    return idlType;
  } else if (ctx.typedefs.has(idlType.idlType)) {
    const out = deepClone(ctx.typedefs.get(idlType.idlType).resolve(stack));
    resolvedMap.set(original, out);
    out.nullable ||= idlType.nullable;
    out.extAttrs = deepClone(mergeExtAttrs(out.extAttrs, idlType.extAttrs));
    if (out.union) {
      for (const type of out.idlType) {
        type.extAttrs = deepClone(mergeExtAttrs(type.extAttrs, idlType.extAttrs));
      }
    }
    return out;
  } else if (conversions[idlType.idlType]) {
    // already resolved
    return idlType;
  }
  // unknown
  return idlType;
}

// webidl2 AST nodes store most of their data in prototype getters, not own properties. structuredClone() only copies
// own properties, so it would produce nearly-empty objects. JSON.parse(JSON.stringify()) calls toJSON(), which
// materializes the getters into a complete plain-object representation.
function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function generateTypeConversion(
  ctx,
  name,
  idlType,
  argAttrs = [],
  parentName = undefined,
  errPrefix = '"The provided value"'
) {
  const requires = new utils.RequiresMap(ctx);
  let str = "";

  idlType = resolveType(ctx, idlType);
  const extAttrs = idlType.extAttrs !== undefined ? [...idlType.extAttrs, ...argAttrs] : argAttrs;

  if (idlType.nullable) {
    const callbackFunction = ctx.callbackFunctions.get(idlType.idlType);
    if (callbackFunction !== undefined && callbackFunction.legacyTreatNonObjectAsNull) {
      str += `
        if (!utils.isObject(${name})) {
          ${name} = null;
        } else {
      `;
    } else {
      str += `
        if (${name} === null || ${name} === undefined) {
          ${name} = null;
        } else {
      `;
    }
  }

  if (idlType.union) {
    // union type
    generateUnion();
  } else if (idlType.generic === "async_sequence") {
    // async_sequence type
    generateAsyncSequence();
  } else if (idlType.generic === "sequence") {
    // sequence type
    generateSequence();
  } else if (idlType.generic === "record") {
    // record type
    generateRecord();
  } else if (idlType.generic === "Promise") {
    // Promise type
    generatePromise();
  } else if (idlType.generic === "FrozenArray") {
    // frozen array type
    generateFrozenArray();
  } else if (conversions[idlType.idlType]) {
    // string or number type compatible with webidl-conversions
    str += generateWebIDLConversions(`conversions["${idlType.idlType}"]`, extAttrs);
  } else if (resolvedTypes.has(ctx.typeOf(idlType.idlType))) {
    // callback functions, callback interfaces, dictionaries, enumerations, and interfaces
    let fn;
    // Avoid requiring the interface itself
    if (idlType.idlType !== parentName) {
      fn = `${idlType.idlType}.convert`;
      requires.addRelative(idlType.idlType);
    } else {
      fn = `exports.convert`;
    }
    generateWebIDL2JS(fn);
  } else {
    // unknown
    // Try to get the impl anyway.
    str += `
      ${name} = utils.tryImplForWrapper(${name});
    `;
  }

  if (idlType.nullable) {
    str += "}";
  }

  return {
    requires,
    body: str
  };

  function generateUnion() {
    const union = extractUnionInfo(ctx, idlType, errPrefix);
    const output = [];

    if (union.unknown) {
      // Oh well, what do we know...
      str += `${name} = utils.tryImplForWrapper(${name});`;
      return;
    }

    if (!idlType.nullable && union.dictionary) {
      const conv = generateTypeConversion(ctx, name, union.dictionary, [], parentName, errPrefix);
      requires.merge(conv.requires);
      output.push(`
        if (${name} === null || ${name} === undefined) {
          ${conv.body}
        }
      `);
    }

    if (union.object) {
      output.push(`
        if (utils.isObject(${name})) {
          if (${name}[utils.implSymbol]) {
            ${name} = utils.implForWrapper(${name});
          }
        }
      `);
    } else if (union.interfaces.size > 0) {
      const exprs = [...union.interfaces].map(iface => {
        let fn;
        // Avoid requiring the interface itself
        if (iface !== parentName) {
          fn = `${iface}.is`;
          requires.addRelative(iface);
        } else {
          fn = "exports.is";
        }
        return `${fn}(${name})`;
      });
      output.push(`
        if (${exprs.join(" || ")}) {
          ${name} = utils.implForWrapper(${name});
        }
      `);
    }

    if (union.ArrayBuffer) {
      output.push(`if (utils.isArrayBuffer(${name})) {
        ${generateTypeConversion(ctx, name, union.ArrayBuffer, [], parentName, errPrefix).body}
      }`);
    }
    if (union.SharedArrayBuffer) {
      output.push(`if (utils.isSharedArrayBuffer(${name})) {
        ${generateTypeConversion(ctx, name, union.SharedArrayBuffer, [], parentName, errPrefix).body}
      }`);
    }
    if (union.ArrayBufferViews.size > 0) {
      const viewIdlTypes = new Set([...union.ArrayBufferViews].map(item => item.idlType));
      // Skip specific type check if all ArrayBufferView member types are allowed.
      if (viewIdlTypes.size === arrayBufferViewTypes.size) {
        const viewExtAttrs = mergeExtAttrsOfTypes(union.ArrayBufferViews);
        // We can't call generateTypeConversion since that will just expand the union again and recurse back to here,
        // so instead we call generateWebIDLConversions directly.
        output.push(`if (ArrayBuffer.isView(${name})) {
          ${generateWebIDLConversions(`conversions["ArrayBufferView"]`, viewExtAttrs)}
        }`);
      } else {
        for (const viewType of union.ArrayBufferViews) {
          output.push(`if (ArrayBuffer.isView(${name}) && ${name}.constructor.name === "${viewType.idlType}") {
            ${generateTypeConversion(ctx, name, viewType, [], parentName, errPrefix).body}
          }`);
        }
      }
    }

    if (union.callbackFunction) {
      const conv = generateTypeConversion(
        ctx,
        name,
        union.callbackFunction,
        [],
        parentName,
        `${errPrefix} + " callback function"`
      );
      requires.merge(conv.requires);
      output.push(`
        if (typeof ${name} === "function") {
          ${conv.body}
        }
      `);
    }

    if (union.sequenceLike || union.dictionary || union.record || union.callbackInterface) {
      let code = `if (utils.isObject(${name})) {`;

      if (union.sequenceLike) {
        if (union.sequenceLike.generic === "async_sequence") {
          code += `if (
            utils.getMethod(${name}, Symbol.asyncIterator, ${errPrefix}) !== undefined ||
            utils.getMethod(${name}, Symbol.iterator, ${errPrefix}) !== undefined
          ) {`;
        } else {
          code += `if (utils.getMethod(${name}, Symbol.iterator, ${errPrefix}) !== undefined) {`;
        }
        const conv = generateTypeConversion(
          ctx,
          name,
          union.sequenceLike,
          [],
          parentName,
          `${errPrefix} + " ${union.sequenceLike.generic}"`
        );
        requires.merge(conv.requires);
        code += conv.body;
        code += `} else {`;
      }

      if (union.dictionary) {
        const conv = generateTypeConversion(
          ctx,
          name,
          union.dictionary,
          [],
          parentName,
          `${errPrefix} + " dictionary"`
        );
        requires.merge(conv.requires);
        code += conv.body;
      } else if (union.record) {
        const conv = generateTypeConversion(ctx, name, union.record, [], parentName, `${errPrefix} + " record"`);
        requires.merge(conv.requires);
        code += conv.body;
      } else if (union.callbackInterface) {
        const conv = generateTypeConversion(
          ctx,
          name,
          union.callbackInterface,
          [],
          parentName,
          `${errPrefix} + " callback interface"`
        );
        requires.merge(conv.requires);
        code += conv.body;
      }

      if (union.sequenceLike) {
        code += "}";
      }

      code += "}";

      output.push(code);
    }

    if (union.boolean) {
      output.push(`
        if (typeof ${name} === "boolean") {
          ${generateTypeConversion(ctx, name, union.boolean, [], parentName, errPrefix).body}
        }
      `);
    }

    if (union.numeric) {
      output.push(`
        if (typeof ${name} === "number") {
          ${generateTypeConversion(ctx, name, union.numeric, [], parentName, errPrefix).body}
        }
      `);
    }

    {
      let code = "{";
      const type = union.string || union.numeric || union.boolean;
      if (type) {
        const conv = generateTypeConversion(ctx, name, type, [], parentName, errPrefix);
        code += conv.body;
        requires.merge(conv.requires);
      } else {
        code += `throw new globalObject.TypeError(${errPrefix} + " is not of any supported type.")`;
      }
      code += "}";
      output.push(code);
    }

    str += output.join(" else ");
  }

  function generateAsyncSequence() {
    const conv = generateTypeConversion(
      ctx,
      "item",
      idlType.idlType[0],
      [],
      parentName,
      `${errPrefix} + "'s element"`
    );
    requires.merge(conv.requires);

    str += `
      ${name} = utils.convertAsyncSequence(
        ${name},
        function (item) {
          ${conv.body};
          return item;
        },
        ${errPrefix}
      );
    `;
  }

  function generateSequence() {
    const conv = generateTypeConversion(
      ctx,
      "nextItem",
      idlType.idlType[0],
      [],
      parentName,
      `${errPrefix} + "'s element"`
    );
    requires.merge(conv.requires);

    str += `
      if (!utils.isObject(${name})) {
        throw new globalObject.TypeError(${errPrefix} + " is not an iterable object.");
      } else {
        const V = [];
        const tmp = ${name};
        for (let nextItem of tmp) {
          ${conv.body}
          V.push(nextItem);
        }
        ${name} = V;
      }
    `;
  }

  function generateRecord() {
    const keyConv = generateTypeConversion(
      ctx,
      "typedKey",
      idlType.idlType[0],
      [],
      parentName,
      `${errPrefix} + "'s key"`
    );
    requires.merge(keyConv.requires);
    const valConv = generateTypeConversion(
      ctx,
      "typedValue",
      idlType.idlType[1],
      [],
      parentName,
      `${errPrefix} + "'s value"`
    );
    requires.merge(valConv.requires);

    str += `
      if (!utils.isObject(${name})) {
        throw new globalObject.TypeError(${errPrefix} + " is not an object.");
      } else {
        const result = Object.create(null);
        for (const key of Reflect.ownKeys(${name})) {
          const desc = Object.getOwnPropertyDescriptor(${name}, key);
          if (desc && desc.enumerable) {
            let typedKey = key;
            ${keyConv.body}

            let typedValue = ${name}[key];
            ${valConv.body}
            result[typedKey] = typedValue;
          }
        }
        ${name} = result;
      }
    `;
  }

  function generatePromise() {
    str += `${name} = new globalObject.Promise(resolve => resolve(${name}));`;
  }

  function generateFrozenArray() {
    generateSequence();
    str += `${name} = Object.freeze(${name});`;
  }

  function generateWebIDLConversions(conversionFn, attrs) {
    const enforceRange = utils.getExtAttr(attrs, "EnforceRange");
    const clamp = utils.getExtAttr(attrs, "Clamp");
    const nullToEmptyString = utils.getExtAttr(attrs, "LegacyNullToEmptyString");
    const allowResizable = utils.getExtAttr(attrs, "AllowResizable");
    const allowShared = utils.getExtAttr(attrs, "AllowShared");

    let optString = `context: ${errPrefix}, globals: globalObject,`;
    if (clamp) {
      optString += "clamp: true,";
    }
    if (enforceRange) {
      optString += "enforceRange: true,";
    }
    if (nullToEmptyString) {
      optString += "treatNullAsEmptyString: true,";
    }
    if (allowResizable) {
      optString += "allowResizable: true,";
    }
    if (allowShared) {
      optString += "allowShared: true,";
    }
    if (idlType.array) {
      return `
        for (let i = 0; i < ${name}.length; ++i) {
          ${name}[i] = ${conversionFn}(${name}[i], { ${optString} });
        }
      `;
    }
    return `
      ${name} = ${conversionFn}(${name}, { ${optString} });
    `;
  }

  function generateWebIDL2JS(conversionFn) {
    const optString = `context: ${errPrefix}`;

    if (idlType.array) {
      str += `
        for (let i = 0; i < ${name}.length; ++i) {
          ${name}[i] = ${conversionFn}(globalObject, ${name}[i], { ${optString} });
        }
      `;
    } else {
      str += `
        ${name} = ${conversionFn}(globalObject, ${name}, { ${optString} });
      `;
    }
  }
}

// Condense the member types of a union to a more consumable structured object. At the same time, check for the validity
// of the union type (no forbidden types, no indistinguishable member types). Duplicated types are allowed for now
// though.
function extractUnionInfo(ctx, idlType, errPrefix) {
  const seen = {
    sequenceLike: null,
    record: null,
    get dictionaryLike() {
      return this.dictionary !== null || this.record !== null || this.callbackInterface !== null;
    },
    ArrayBuffer: null,
    SharedArrayBuffer: null,
    ArrayBufferViews: new Set(),
    get BufferSource() {
      return this.ArrayBuffer || this.SharedArrayBuffer || this.ArrayBufferViews.size > 0;
    },
    object: false,
    string: null,
    numeric: null,
    boolean: null,
    callbackFunction: null,
    dictionary: null,
    callbackInterface: null,
    interfaces: new Set(),
    get interfaceLike() {
      return this.interfaces.size > 0 || this.BufferSource;
    },
    unknown: false
  };
  for (const item of idlType.idlType) {
    if (item.generic === "sequence" || item.generic === "async_sequence" || item.generic === "FrozenArray") {
      if (seen.sequenceLike) {
        error("There can only be one sequence-like type in a union type");
      }
      seen.sequenceLike = item;
    } else if (item.generic === "record") {
      if (seen.object) {
        error("Dictionary-like types are not distinguishable with object type");
      }
      if (seen.callbackFunction) {
        error("Dictionary-like types are not distinguishable with callback functions");
      }
      if (seen.dictionaryLike) {
        error("There can only be one dictionary-like type in a union type");
      }
      seen.record = item;
    } else if (item.generic === "Promise") {
      error("Promise types are not supported in union types");
    } else if (item.generic) {
      error(`Unknown generic type ${item.generic}`);
    } else if (item.idlType === "any") {
      error("any type is not allowed in a union type");
    } else if (item.idlType === "ArrayBuffer") {
      if (seen.object) {
        error("ArrayBuffer is not distinguishable with object type");
      }
      seen.ArrayBuffer = item;
    } else if (item.idlType === "SharedArrayBuffer") {
      if (seen.object) {
        error("SharedArrayBuffer is not distinguishable with object type");
      }
      seen.SharedArrayBuffer = item;
    } else if (arrayBufferViewTypes.has(item.idlType)) {
      if (seen.object) {
        error(`${item.idlType} is not distinguishable with object type`);
      }
      seen.ArrayBufferViews.add(item);
    } else if (stringTypes.has(item.idlType) || ctx.enumerations.has(item.idlType)) {
      if (seen.string) {
        error("There can only be one string type in a union type");
      }
      seen.string = item;
    } else if (numericTypes.has(item.idlType)) {
      if (seen.numeric) {
        error("There can only be one numeric type in a union type");
      }
      seen.numeric = item;
    } else if (item.idlType === "object") {
      if (seen.interfaceLike) {
        error("Object type is not distinguishable with interface-like types");
      }
      if (seen.callbackFunction) {
        error("Object type is not distinguishable with callback functions");
      }
      if (seen.dictionaryLike) {
        error("Object type is not distinguishable with dictionary-like types");
      }
      if (seen.sequenceLike) {
        error("Object type is not distinguishable with sequence-like types");
      }
      seen.object = true;
    } else if (item.idlType === "boolean") {
      seen.boolean = item;
    } else if (ctx.callbackFunctions.has(item.idlType)) {
      if (seen.object) {
        error("Callback functions are not distinguishable with object type");
      }
      if (seen.dictionaryLike) {
        error("Callback functions are not distinguishable with dictionary-like types");
      }
      seen.callbackFunction = item;
    } else if (ctx.dictionaries.has(item.idlType)) {
      if (seen.object) {
        error("Dictionary-like types are not distinguishable with object type");
      }
      if (seen.callbackFunction) {
        error("Dictionary-like types are not distinguishable with callback functions");
      }
      if (seen.dictionaryLike) {
        error("There can only be one dictionary-like type in a union type");
      }
      seen.dictionary = item;
    } else if (ctx.callbackInterfaces.has(item.idlType)) {
      if (seen.object) {
        error("Dictionary-like types are not distinguishable with object type");
      }
      if (seen.callbackFunction) {
        error("Dictionary-like types are not distinguishable with callback functions");
      }
      if (seen.dictionaryLike) {
        error("There can only be one dictionary-like type in a union type");
      }
      seen.callbackInterface = item;
    } else if (ctx.interfaces.has(item.idlType)) {
      if (seen.object) {
        error("Interface types are not distinguishable with object type");
      }
      seen.interfaces.add(item.idlType);
    } else {
      seen.unknown = true;
    }
  }
  return seen;

  function error(msg) {
    throw new Error(`${msg}\n    When compiling "${eval(errPrefix)}"`); // eslint-disable-line no-eval
  }
}

// https://heycam.github.io/webidl/#dfn-includes-a-nullable-type
function includesNullableType(ctx, idlType) {
  idlType = resolveType(ctx, idlType);
  if (idlType.nullable) {
    return true;
  }
  if (!idlType.union) {
    return false;
  }
  for (const type of idlType.idlType) {
    if (type.nullable) {
      return true;
    }
  }
  return false;
}

function includesDictionaryType(ctx, idlType) {
  idlType = resolveType(ctx, idlType);
  if (typeof idlType.idlType === "string" && ctx.dictionaries.has(idlType.idlType)) {
    return true;
  }
  if (!idlType.union) {
    return false;
  }
  for (const type of idlType.idlType) {
    if (includesDictionaryType(ctx, type)) {
      return true;
    }
  }
  return false;
}

function sameType(ctx, type1, type2) {
  if (type1 === type2) {
    return true;
  }

  type1 = resolveType(ctx, type1);
  type2 = resolveType(ctx, type2);
  if (type1.generic !== type2.generic) {
    return false;
  }
  if (type1.union !== type2.union) {
    return false;
  }
  if (includesNullableType(ctx, type1) !== includesNullableType(ctx, type2)) {
    return false;
  }
  // TODO: check extended attributes
  if (typeof type1.idlType === "string" || typeof type2.idlType === "string") {
    return type1.idlType === type2.idlType;
  }
  if (type1.generic === "sequence" || type1.generic === "FrozenArray") {
    return sameType(ctx, type1.idlType, type2.idlType);
  }
  if (type1.generic === "record") {
    return sameType(ctx, type1.idlType[0], type2.idlType[0]) &&
           sameType(ctx, type2.idlType[1], type2.idlType[1]);
  }

  if (!type1.union) {
    // This branch should never be taken.
    return false;
  }
  const extracted1 = extractUnionInfo(ctx, type1, `""`);
  const extracted2 = extractUnionInfo(ctx, type2, `""`);
  return sameType(ctx, extracted1.sequenceLike, extracted2.sequenceLike) &&
         sameType(ctx, extracted1.record, extracted2.record) &&
         sameType(ctx, extracted1.ArrayBuffer, extracted2.ArrayBuffer) &&
         sameType(ctx, extracted1.SharedArrayBuffer, extracted2.SharedArrayBuffer) &&
         sameTypeArray(ctx, [...extracted1.ArrayBufferViews].sort(), [...extracted2.ArrayBufferViews].sort()) &&
         extracted1.object === extracted2.object &&
         sameType(ctx, extracted1.string, extracted2.string) &&
         sameType(ctx, extracted1.numeric, extracted2.numeric) &&
         sameType(ctx, extracted1.boolean, extracted2.boolean) &&
         extracted1.callback === extracted2.callback &&
         sameType(ctx, extracted1.callbackFunction, extracted2.callbackFunction) &&
         sameType(ctx, extracted1.dictionary, extracted2.dictionary) &&
         sameArray([...extracted1.interfaces].sort(), [...extracted2.interfaces].sort()) &&
         sameType(ctx, extracted1.callbackInterface, extracted2.callbackInterface) &&
         extracted1.unknown === extracted2.unknown;
}

function sameTypeArray(ctx, types1, types2) {
  return sameArray(types1, types2, (type1, type2) => sameType(ctx, type1, type2));
}

function sameArray(array1, array2, comparator = (x, y) => x === y) {
  return array1.length === array2.length && array1.every((element1, index) => comparator(element1, array2[index]));
}

function isSequenceLike(type) {
  return type.generic === "sequence" ||
    type.generic === "async_sequence" ||
    type.generic === "FrozenArray";
}

function areDistinguishable(ctx, type1, type2) {
  const resolved1 = resolveType(ctx, type1);
  const resolved2 = resolveType(ctx, type2);

  const effectivelyNullable1 = includesNullableType(ctx, resolved1) || includesDictionaryType(ctx, resolved1);
  const effectivelyNullable2 = includesNullableType(ctx, resolved2) || includesDictionaryType(ctx, resolved2);
  if ((includesNullableType(ctx, resolved1) && effectivelyNullable2) ||
      (effectivelyNullable1 && includesNullableType(ctx, resolved2))) {
    return false;
  }

  if (resolved1.union && resolved2.union) {
    for (const i of resolved1.idlType) {
      for (const j of resolved2.idlType) {
        if (!areDistinguishable(ctx, i, j)) {
          return false;
        }
      }
    }
    return true;
  }

  function inner(inner1, inner2) {
    if (inner1.union) {
      for (const i of inner1.idlType) {
        if (!areDistinguishable(ctx, i, inner2)) {
          return false;
        }
      }
      return true;
    }

    if (inner1.idlType === "boolean") {
      return inner2.idlType !== "boolean";
    }

    if (numericTypes.has(inner1.idlType)) {
      return !numericTypes.has(inner2.idlType);
    }

    if (stringTypes.has(inner1.idlType) || ctx.enumerations.has(inner1.idlType)) {
      return !stringTypes.has(inner2.idlType) && !ctx.enumerations.has(inner2.idlType);
    }

    const isInterfaceLike1 = ctx.interfaces.has(inner1.idlType) ||
                             bufferSourceTypes.has(inner1.idlType);
    const isInterfaceLike2 = ctx.interfaces.has(inner2.idlType) ||
                             bufferSourceTypes.has(inner2.idlType);
    const isDictionaryLike1 = ctx.dictionaries.has(inner1.idlType) ||
                              ctx.callbackInterfaces.has(inner1.idlType) ||
                              inner1.generic === "record";
    const isDictionaryLike2 = ctx.dictionaries.has(inner2.idlType) ||
                              ctx.callbackInterfaces.has(inner2.idlType) ||
                              inner2.generic === "record";
    const isSequenceLike1 = isSequenceLike(inner1);
    const isSequenceLike2 = isSequenceLike(inner2);

    if (inner1.idlType === "object") {
      return inner2.idlType !== "object" &&
             !isInterfaceLike2 &&
             !isDictionaryLike2 &&
             !isSequenceLike2;
    }

    if (inner1.idlType === "symbol") {
      return inner2.idlType !== "symbol";
    }

    if (isInterfaceLike1) {
      return inner2.idlType !== "object" &&
             (!isInterfaceLike2 ||
              (!ctx.interfaces.has(inner2.idlType) ||
               !new Set(ctx.interfaces.get(inner2.idlType).allInterfaces()).has(inner1.idlType)));
    }

    if (isDictionaryLike1) {
      return inner2.idlType !== "object" && !isDictionaryLike2;
    }

    if (isSequenceLike1) {
      return inner2.idlType !== "object" && !isSequenceLike2;
    }

    return true;
  }

  return inner(resolved1, resolved2) && inner(resolved2, resolved1);
}

module.exports = {
  arrayBufferViewTypes,
  stringTypes,
  numericTypes,

  generateTypeConversion,
  resolveType,
  includesNullableType,
  includesDictionaryType,
  areDistinguishable,
  sameType
};
