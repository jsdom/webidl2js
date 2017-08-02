"use strict";

const conversions = require("webidl-conversions");

const utils = require("./utils");

const arrayBufferViewTypes = new Set([
  "Int8Array", "Int16Array", "Int32Array", "Uint8Array", "Uint16Array", "Uint32Array",
  "Uint8ClampedArray", "Float32Array", "Float64Array", "DataView"
]);
const stringTypes = new Set(["DOMString", "ByteString", "USVString"]);
const integerTypes = new Set([
  "byte", "octet", "short", "unsigned short", "long", "unsigned long",
  "long long", "unsigned long long"
]);
const numericTypes = new Set([
  ...integerTypes, "float", "unrestricted float", "double", "unrestricted double"
]);

function mergeExtAttrs(a = [], b = []) {
  return [...a, ...b];
}

function resolveType(ctx, idlType, stack = []) {
  idlType = deepClone(idlType);
  const { customTypes, typedefs } = ctx;
  if (idlType.union) {
    const types = [];
    for (let type of idlType.idlType) {
      type = resolveType(ctx, type, stack);
      idlType.nullable = idlType.nullable || type.nullable;
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
  } else if (idlType.generic === "sequence" || idlType.generic === "FrozenArray" || idlType.generic === "Promise") {
    idlType.idlType = resolveType(ctx, idlType.idlType, stack);
    return idlType;
  } else if (idlType.generic === "record") {
    idlType.idlType = idlType.idlType.map(t => resolveType(ctx, t, stack));
    return idlType;
  } else if (customTypes.has(idlType.idlType)) {
    // already resolved
    return idlType;
  } else if (typedefs.has(idlType.idlType)) {
    const out = deepClone(typedefs.get(idlType.idlType).resolve(stack));
    out.nullable = out.nullable || idlType.nullable;
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

function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function generateTypeConversion(ctx, name, idlType, argAttrs = [], parentName, errPrefix = '"The provided value"') {
  const { customTypes } = ctx;
  const requires = new utils.RequiresMap(ctx);
  let str = "";

  idlType = resolveType(ctx, idlType);
  const extAttrs = idlType.extAttrs !== undefined ? [...idlType.extAttrs, ...argAttrs] : argAttrs;

  if (idlType.nullable) {
    str += `
      if (${name} === null || ${name} === undefined) {
        ${name} = null;
      } else {
    `;
  }

  if (idlType.union) {
    // union type
    generateUnion();
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
    generateGeneric(`conversions["${idlType.idlType}"]`);
  } else if (customTypes.has(idlType.idlType)) {
    // dictionaries or interfaces
    let fn;
    // Avoid requiring the interface itself
    if (idlType.idlType !== parentName) {
      fn = `convert${idlType.idlType}`;
      requires.add(idlType.idlType, "convert");
    } else {
      fn = `module.exports.convert`;
    }
    generateGeneric(fn);
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
      output.push(`if (utils.isObject(${name}) && ${name}[utils.implSymbol]) {
                     ${name} = utils.implForWrapper(${name});
                   }`);
    } else if (union.interfaces.size > 0) {
      const exprs = [...union.interfaces].map(iface => {
        let fn;
        // Avoid requiring the interface itself
        if (iface !== parentName) {
          fn = `is${iface}`;
          requires.add(iface, "is");
        } else {
          fn = "module.exports.is";
        }
        return `${fn}(${name})`;
      });
      output.push(`
        if (${exprs.join(" || ")}) {
          ${name} = utils.implForWrapper(${name});
        }
      `);
    }

    // Handle Error and DOMException the same way
    if (union.exception || union.object) {
      output.push(`if (${name} instanceof Error) {}`);
    }

    // Do not convert buffer source types as the impl code can either "get a reference" or "get a copy" to the bytes.
    if (union.ArrayBuffer || union.object) {
      output.push(`if (${name} instanceof ArrayBuffer) {}`);
    }
    if (union.ArrayBufferViews.size > 0 || union.object) {
      let condition = `ArrayBuffer.isView(${name})`;
      // Skip specific type check if all ArrayBufferView member types are allowed.
      if (union.ArrayBufferViews.size !== arrayBufferViewTypes.size) {
        const exprs = [...union.ArrayBufferViews].map(a => `${name} instanceof ${a}`);
        condition += ` && (${exprs.join(" || ")})`;
      }
      output.push(`if (${condition}) {}`);
    }

    if (union.callback || union.object) {
      output.push(`if (typeof ${name} === "function") {}`);
    }

    if (union.sequenceLike || union.dictionary || union.record || union.object) {
      let code = `if (utils.isObject(${name})) {`;

      if (union.sequenceLike) {
        code += `if (${name}[Symbol.iterator] !== undefined) {`;
        const conv = generateTypeConversion(ctx, name, union.sequenceLike, [], parentName,
          `${errPrefix} + " sequence"`);
        requires.merge(conv.requires);
        code += conv.body;
        code += `} else {`;
      }

      if (union.dictionary || union.record) {
        const prop = union.dictionary ? "dictionary" : "record";
        const conv = generateTypeConversion(ctx, name, union[prop], [], parentName,
          `${errPrefix} + " ${prop}"`);
        requires.merge(conv.requires);
        code += conv.body;
      } else if (union.object) {
        // noop
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
        code += generateTypeConversion(ctx, name, type, [], parentName, errPrefix).body;
      } else {
        code += `throw new TypeError(${errPrefix} + " is not of any supported type.")`;
      }
      code += "}";
      output.push(code);
    }

    str += output.join(" else ");
  }

  function generateSequence() {
    const conv = generateTypeConversion(ctx, "nextItem", idlType.idlType, [], parentName,
      `${errPrefix} + "'s element"`);
    requires.merge(conv.requires);

    str += `
      if (!utils.isObject(${name})) {
        throw new TypeError(${errPrefix} + " is not an iterable object.");
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
    const keyConv = generateTypeConversion(ctx, "typedKey", idlType.idlType[0], [], parentName,
      `${errPrefix} + "'s key"`);
    requires.merge(keyConv.requires);
    const valConv = generateTypeConversion(ctx, "typedValue", idlType.idlType[1], [], parentName,
      `${errPrefix} + "'s value"`);
    requires.merge(valConv.requires);

    str += `
      if (!utils.isObject(${name})) {
        throw new TypeError(${errPrefix} + " is not an object.");
      } else {
        const result = Object.create(null);
        for (const key of Reflect.ownKeys(${name})) {
          const desc = Object.getOwnPropertyDescriptor(${name}, key);
          if (desc && desc.enumerable) {
            let typedKey = key;
            let typedValue = ${name}[key];
            ${keyConv.body}
            ${valConv.body}
            result[typedKey] = typedValue;
          }
        }
        ${name} = result;
      }
    `;
  }

  function generatePromise() {
    let handler;
    if (idlType.idlType.idlType === "void") {
      // Do nothing.
      handler = "";
    } else {
      const conv = generateTypeConversion(ctx, "value", idlType.idlType, [], parentName,
        `${errPrefix} + " promise value"`);
      requires.merge(conv.requires);
      handler = `
        ${conv.body}
        return value;
      `;
    }
    str += `
      ${name} = Promise.resolve(${name}).then(value => {
        ${handler}
      }, reason => reason);
    `;
  }

  function generateFrozenArray() {
    generateSequence();
    str += `${name} = Object.freeze(${name});`;
  }

  function generateGeneric(conversionFn) {
    const enforceRange = utils.getExtAttr(extAttrs, "EnforceRange");
    const clamp = utils.getExtAttr(extAttrs, "Clamp");
    const treatNullAs = utils.getExtAttr(extAttrs, "TreatNullAs");

    let optString = `context: ${errPrefix},`;
    if (clamp) {
      optString += "clamp: true,";
    }
    if (enforceRange) {
      optString += "enforceRange: true,";
    }
    if (treatNullAs && treatNullAs.rhs.value === "EmptyString") {
      optString += "treatNullAsEmptyString: true,";
    }
    if (idlType.array) {
      str += `
        for (let i = 0; i < ${name}.length; ++i) {
          ${name}[i] = ${conversionFn}(${name}[i], { ${optString} });
        }
      `;
    } else {
      str += `
        ${name} = ${conversionFn}(${name}, { ${optString} });
      `;
    }
  }
}

// Condense the member types of a union to a more consumable structured object. At the same time, check for the validity
// of the union type (no forbidden types, no indistinguishable member types). Duplicated types are allowed for now
// though.
function extractUnionInfo(ctx, idlType, errPrefix) {
  const { customTypes } = ctx;
  const seen = {
    sequenceLike: null,
    record: null,
    get dictionaryLike() {
      return this.dictionary !== null || this.record !== null;
    },
    ArrayBuffer: false,
    ArrayBufferViews: new Set(),
    get BufferSource() {
      return this.ArrayBuffer || this.ArrayBufferViews.size > 0;
    },
    object: false,
    exception: null,
    string: null,
    numeric: null,
    boolean: null,
    // Callback function, not interface
    callback: false,
    dictionary: null,
    interfaces: new Set(),
    get interfaceLike() {
      return this.interfaces.size > 0 || this.exception !== null || this.BufferSource;
    },
    unknown: false
  };
  for (const item of idlType.idlType) {
    if (item.generic === "sequence" || item.generic === "FrozenArray") {
      if (seen.sequenceLike) {
        error("There can only be one sequence-like type in a union type");
      }
      seen.sequenceLike = item;
    } else if (item.generic === "record") {
      if (seen.record || seen.dictionary) {
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
      seen.ArrayBuffer = true;
    } else if (arrayBufferViewTypes.has(item.idlType)) {
      if (seen.object) {
        error(`${item.idlType} is not distinguishable with object type`);
      }
      seen.ArrayBufferViews.add(item.idlType);
    } else if (stringTypes.has(item.idlType)) {
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
      if (seen.callback) {
        error("Object type is not distinguishable with callback functions");
      }
      if (seen.dictionaryLike) {
        error("Object type is not distinguishable with dictionary-like types");
      }
      if (seen.sequenceLike) {
        error("Object type is not distinguishable with sequence-like types");
      }
      seen.object = true;
    } else if (item.idlType === "DOMException" || item.idlType === "Error") {
      if (seen.object) {
        error("Exception types are not distinguishable with object type");
      }
      if (seen.exception && seen.exception.idlType !== item.idlType) {
        error("DOMException is not distinguishable with Error type");
      }
      seen.exception = item;
    } else if (item.idlType === "boolean") {
      seen.boolean = item;
    } else if (item.idlType === "Function") {
      // TODO: add full support for callback functions
      if (seen.object) {
        error("Callback functions are not distinguishable with object type");
      }
      if (seen.dictionaryLike) {
        error("Callback functions are not distinguishable with dictionary-like types");
      }
      seen.callback = true;
    } else if (customTypes.has(item.idlType)) {
      const type = customTypes.get(item.idlType);
      if (type === "dictionary") {
        if (seen.object) {
          error("Dictionary-like types are not distinguishable with object type");
        }
        if (seen.callback) {
          error("Dictionary-like types are not distinguishable with callback functions");
        }
        if (seen.dictionaryLike) {
          error("There can only be one dictionary-like type in a union type");
        }
        seen.dictionary = item;
      } else if (type === "interface") {
        if (seen.object) {
          error("Interface types are not distinguishable with object type");
        }
        seen.interfaces.add(item.idlType);
      } else {
        error(`Unknown custom type ${type}`);
      }
    } else {
      seen.unknown = true;
    }
  }
  return seen;

  function error(msg) {
    throw new Error(`${msg}\n    When compiling "${eval(errPrefix)}"`); // eslint-disable-line no-eval
  }
}

module.exports = {
  generateTypeConversion,
  resolveType
};
