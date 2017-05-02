"use strict";

const path = require("path");

const co = require("co");
const fs = require("pn/fs");
const webidl = require("webidl2");
const prettier = require("prettier");

const Context = require("./context");
const Interface = require("./constructs/interface");
const Dictionary = require("./constructs/dictionary");

class Transformer {
  constructor(opts = {}) {
    this.ctx = new Context({
      implSuffix: opts.implSuffix
    });
    this.options = Object.assign({
      suppressErrors: false
    }, opts);

    this.sources = [];
  }

  addSource(idl, impl) {
    if (typeof idl !== "string") {
      throw new TypeError("idl path has to be a string");
    }
    if (typeof impl !== "string") {
      throw new TypeError("impl path has to be a string");
    }
    this.sources.push({ idlPath: idl, impl });
    return this;
  }

  *_collectSources() {
    const stats = yield Promise.all(this.sources.map((src) => fs.stat(src.idlPath)));
    const files = [];
    for (let i = 0; i < stats.length; ++i) {
      if (stats[i].isDirectory()) {
        const folderContents = yield fs.readdir(this.sources[i].idlPath);
        for (const file of folderContents) {
          if (file.endsWith(".idl")) {
            files.push({
              idlPath: path.join(this.sources[i].idlPath, file),
              impl: this.sources[i].impl
            });
          }
        }
      } else {
        files.push({
          idlPath: this.sources[i].idlPath,
          impl: this.sources[i].impl
        });
      }
    }
    return files;
  }

  *_readFiles(files) {
    const zipped = [];
    const fileContents = yield Promise.all(files.map((f) => fs.readFile(f.idlPath, { encoding: 'utf-8' })));
    for (let i = 0; i < files.length; ++i) {
      zipped.push({
        idlContent: fileContents[i],
        impl: files[i].impl
      });
    }
    return zipped;
  }

  *_parse(outputDir, contents) {
    const parsed = contents.map((content) => ({
      idl: webidl.parse(content.idlContent),
      impl: content.impl
    }));

    this.ctx.initialize();
    const { interfaces, dictionaries, customTypes } = this.ctx;

    // first we're gathering all full interfaces and ignore partial ones
    for (const file of parsed) {
      for (const instruction of file.idl) {
        let obj;
        switch (instruction.type) {
          case "interface":
            if (instruction.partial) {
              break;
            }

            obj = new Interface(this.ctx, instruction, {
              implDir: path.resolve(outputDir, file.impl)
            });
            interfaces[obj.name] = obj;
            break;
          case "implements":
            break; // handled later
          case "dictionary":
            if (instruction.partial) {
              break;
            }

            obj = new Dictionary(this.ctx, instruction);
            dictionaries[obj.name] = obj;
            customTypes.add(instruction.name);
            break;
          default:
            if (!this.options.suppressErrors) {
              throw new Error("Can't convert type '" + instruction.type + "'");
            }
        }
      }
    }

    // second we add all partial members and handle implements
    for (const file of parsed) {
      for (const instruction of file.idl) {
        let oldMembers;
        let extAttrs;
        switch (instruction.type) {
          case "interface":
            if (!instruction.partial) {
              break;
            }

            if (this.options.suppressErrors && !interfaces[instruction.name]) {
              break;
            }
            oldMembers = interfaces[instruction.name].idl.members;
            oldMembers.push.apply(oldMembers, instruction.members);
            extAttrs = interfaces[instruction.name].idl.extAttrs;
            extAttrs.push.apply(extAttrs, instruction.extAttrs);
            break;
          case "dictionary":
            if (!instruction.partial) {
              break;
            }
            if (this.options.suppressErrors && !dictionaries[instruction.name]) {
              break;
            }
            oldMembers = dictionaries[instruction.name].idl.members;
            oldMembers.push.apply(oldMembers, instruction.members);
            extAttrs = dictionaries[instruction.name].idl.extAttrs;
            extAttrs.push.apply(extAttrs, instruction.extAttrs);
            break;
          case "implements":
            if (this.options.suppressErrors && !interfaces[instruction.target]) {
              break;
            }
            interfaces[instruction.target].implements(instruction.implements);
            break;
        }
      }
    }
  }

  *_writeFiles(outputDir) {
    let utilsText = yield fs.readFile(__dirname + "/output/utils.js");
    yield fs.writeFile(this.options.utilPath, utilsText);

    const { interfaces, dictionaries } = this.ctx;

    let interfaceStub = yield fs.readFile(__dirname + "/output/interfaceStub.js");
    let keys = Object.keys(interfaces).concat(Object.keys(dictionaries));
    for (let key of keys) {
      if (interfaces[key]) {
        yield fs.writeFile(path.join(outputDir, interfaces[key].name + ".js"), interfaceStub);
      } else {
        yield fs.writeFile(path.join(outputDir, dictionaries[key].name + ".js"), "");
      }
    }

    keys = Object.keys(interfaces);
    for (let i = 0; i < keys.length; ++i) {
      const obj = interfaces[keys[i]];
      let source = obj.toString();

      const implDir = path.relative(outputDir, obj.opts.implDir).replace(/\\/g, "/"); // fix windows file paths
      let implFile = implDir + "/" + obj.name + this.ctx.implSuffix;
      if (implFile[0] !== ".") {
        implFile = "./" + implFile;
      }

      let relativeUtils = path.relative(outputDir, this.options.utilPath).replace(/\\/g, '/');
      if (relativeUtils[0] !== ".") {
        relativeUtils = "./" + relativeUtils;
      }

      source = `"use strict";

const conversions = require("webidl-conversions");
const utils = require("${relativeUtils}");\n${source}
const Impl = require("${implFile}.js");\n`;

      source = this._prettify(source);

      yield fs.writeFile(path.join(outputDir, obj.name + ".js"), source);
    }

    keys = Object.keys(dictionaries);
    for (let i = 0; i < keys.length; ++i) {
      const obj = dictionaries[keys[i]];
      let source = obj.toString();

      let relativeUtils = path.relative(outputDir, this.options.utilPath).replace(/\\/g, '/');
      if (relativeUtils[0] !== ".") {
        relativeUtils = "./" + relativeUtils;
      }

      source = `"use strict";

const conversions = require("webidl-conversions");
const utils = require("${relativeUtils}");\n\n` + source;

      source = this._prettify(source);

      yield fs.writeFile(path.join(outputDir, obj.name + ".js"), source);
    }
  }

  _prettify(source) {
    return prettier.format(source, {
      printWidth: 120,
    });
  }

  generate(outputDir) {
    if (!this.options.utilPath) this.options.utilPath = path.join(outputDir, "utils.js");

    return co(function* () {
      const sources = yield* this._collectSources();
      const contents = yield* this._readFiles(sources);
      yield* this._parse(outputDir, contents);
      yield* this._writeFiles(outputDir);
    }.bind(this));
  }
}

module.exports = Transformer;
