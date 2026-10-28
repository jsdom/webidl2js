"use strict";

const enumerationValues = new Set(["", "a\\b", "line\nbreak", "${value}", "`"]);
exports.enumerationValues = enumerationValues;

exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  const string = `${value}`;
  if (!enumerationValues.has(string)) {
    throw new globalObject.TypeError(
      `${context} must be one of: "", "a\\\\b", "line\\nbreak", "\${value}", "\`". Received: ${JSON.stringify(string)}.`,
    );
  }
  return string;
};
