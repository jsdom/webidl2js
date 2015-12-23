"use strict";

const fs = require("fs-extra");
const path = require("path");

const webidl = require("webidl2");

const Interface = require("./lib/constructs/interface");
const Dictionary = require("./lib/constructs/dictionary");

module.exports.generate = function (text, outputDir, implDir, opts) {
  if (!opts) opts = {};
  if (!opts.implSuffix) opts.implSuffix = "";
  if (!opts.utilPath) opts.utilPath = path.join(outputDir, "utils.js");
  implDir = path.relative(outputDir, implDir).replace(/\\/g, "/"); // fix windows file paths

  const interfaces = {};
  const dictionaries = {};
  const customTypes = new Set();
  const idl = webidl.parse(text);
  for (var i = 0; i < idl.length; ++i) {
    switch (idl[i].type) {
      case "dictionary":
        customTypes.add(idl[i].name);
        break;
    }
  }
  for (var i = 0; i < idl.length; ++i) {
    let obj;
    switch (idl[i].type) {
      case "interface":
        if (idl[i].partial) {
          break;
        }

        obj = new Interface(idl[i], { implDir: path.resolve(outputDir, implDir), implSuffix: opts.implSuffix, customTypes });
        interfaces[obj.name] = obj;
        break;
      case "implements":
        break; // handled later
      case "dictionary":
        if (idl[i].partial) {
          break;
        }

        obj = new Dictionary(idl[i], { customTypes });
        dictionaries[obj.name] = obj;
        break;
      default:
        if (!opts.suppressErrors) {
          throw new Error("Can't convert type '" + idl[i].type + "'");
        }
    }
  }
  for (var i = 0; i < idl.length; ++i) {
    let oldMembers;
    let extAttrs;
    switch (idl[i].type) {
      case "interface":
        if (!idl[i].partial) {
          break;
        }

        if (opts.suppressErrors && !interfaces[idl[i].name]) {
          break;
        }
        oldMembers = interfaces[idl[i].name].idl.members;
        oldMembers.push.apply(oldMembers, idl[i].members);
        extAttrs = interfaces[idl[i].name].idl.extAttrs;
        extAttrs.push.apply(oldMembers, idl[i].extAttrs);
        break;
      case "dictionary":
        if (!idl[i].partial) {
          break;
        }
        if (opts.suppressErrors && !dictionaries[idl[i].name]) {
          break;
        }
        oldMembers = dictionaries[idl[i].name].idl.members;
        oldMembers.push.apply(oldMembers, idl[i].members);
        extAttrs = dictionaries[idl[i].name].idl.extAttrs;
        extAttrs.push.apply(oldMembers, idl[i].extAttrs);
        break;
      case "implements":
        if (opts.suppressErrors && !interfaces[idl[i].target]) {
          break;
        }
        interfaces[idl[i].target].implements(idl[i].implements);
        break;
    }
  }

  let utilsText = fs.readFileSync(__dirname + "/lib/output/utils.js");
  fs.writeFileSync(opts.utilPath, utilsText);

  let keys = Object.keys(interfaces).concat(Object.keys(dictionaries));
  for (let key of keys) {
    if (interfaces[key]) {
      fs.writeFileSync(path.join(outputDir, interfaces[key].name + ".js"), "module.exports = { interface: function () {} }");
    } else {
      fs.writeFileSync(path.join(outputDir, dictionaries[key].name + ".js"), "");
    }
  }

  keys = Object.keys(interfaces);
  for (let i = 0; i < keys.length; ++i) {
    const obj = interfaces[keys[i]];
    let source = obj.toString();

    let implFile = implDir + "/" + obj.name + opts.implSuffix;
    if (implFile[0] !== ".") {
      implFile = "./" + implFile;
    }

    let relativeUtils = path.relative(outputDir, opts.utilPath).replace(/\\/g, '/');
    if (relativeUtils[0] !== ".") {
      relativeUtils = "./" + relativeUtils;
    }

    source = `"use strict";

const conversions = require("webidl-conversions");
const utils = require("${relativeUtils}");
const Impl = require("${implFile}.js");\n\n` + source;

    fs.writeFileSync(path.join(outputDir, obj.name + ".js"), source);
  }

  keys = Object.keys(dictionaries);
  for (let i = 0; i < keys.length; ++i) {
    const obj = dictionaries[keys[i]];
    let source = obj.toString();

    let relativeUtils = path.relative(outputDir, opts.utilPath).replace(/\\/g, '/');
    if (relativeUtils[0] !== ".") {
      relativeUtils = "./" + relativeUtils;
    }

    source = `"use strict";

const conversions = require("webidl-conversions");
const utils = require("${relativeUtils}");\n\n` + source;

    fs.writeFileSync(path.join(outputDir, obj.name + ".js"), source);
  }
};
