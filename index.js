"use strict";

const fs = require("fs-extra");
const path = require("path");

const webidl = require("webidl2");

const Interface = require("./lib/constructs/interface");

module.exports.generate = function (text, outputDir, implDir, opts) {
  if (!opts) opts = {};

  const interfaces = {};
  const idl = webidl.parse(text);
  for (var i = 0; i < idl.length; ++i) {
    let obj;
    switch (idl[i].type) {
      case "interface":
        obj = new Interface(idl[i]);
        interfaces[obj.name] = obj;
        break;
      case "implements":
        break; // handled later
      default:
        if (!opts.suppressErrors) {
          throw new Error("Can't convert type '" + idl[i].type + "'");
        }
    }
  }
  for (var i = 0; i < idl.length; ++i) {
    switch (idl[i].type) {
      case "implements":
        interfaces[idl[i].target].implements(idl[i].implements);
        break;
    }
  }

  const keys = Object.keys(interfaces);
  for (let i = 0; i < keys.length; ++i) {
    const obj = interfaces[keys[i]];
    let source = obj.toString();

    source = `"use strict";

const conversions = require("webidl-conversions");
const Impl = require("${path.join(implDir, obj.name)}.js");\n\n` + source;

    fs.writeFileSync(outputDir + obj.name + ".js", source);
  }

  fs.copySync(__dirname + "/lib/utils.js", outputDir + "/utils.js");
};
