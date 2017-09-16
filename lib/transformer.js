"use strict";

const path = require("path");

const co = require("co");
const fs = require("pn/fs");
const webidl = require("webidl2");
const prettier = require("prettier");

const Context = require("./context");
const Typedef = require("./constructs/typedef");
const Interface = require("./constructs/interface");
const Dictionary = require("./constructs/dictionary");
const Enumeration = require("./constructs/enumeration");

class Transformer {
  constructor(opts = {}) {
    this.ctx = new Context({
      implSuffix: opts.implSuffix,
      options: {
        suppressErrors: Boolean(opts.suppressErrors)
      }
    });

    this.sources = [];
    this.utilPath = null;
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

  * _collectSources() {
    const stats = yield Promise.all(this.sources.map(src => fs.stat(src.idlPath)));
    const files = [];
    for (let i = 0; i < stats.length; ++i) {
      if (stats[i].isDirectory()) {
        const folderContents = yield fs.readdir(this.sources[i].idlPath);
        for (const file of folderContents) {
          if (file.endsWith(".webidl")) {
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

  * _readFiles(files) {
    const zipped = [];
    const fileContents = yield Promise.all(files.map(f => fs.readFile(f.idlPath, { encoding: "utf-8" })));
    for (let i = 0; i < files.length; ++i) {
      zipped.push({
        idlContent: fileContents[i],
        impl: files[i].impl
      });
    }
    return zipped;
  }

  _parse(outputDir, contents) {
    const parsed = contents.map(content => ({
      idl: webidl.parse(content.idlContent),
      impl: content.impl
    }));

    this.ctx.initialize();
    const { interfaces, dictionaries, enumerations, typedefs, customTypes } = this.ctx;

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
            interfaces.set(obj.name, obj);
            customTypes.set(obj.name, "interface");
            break;
          case "implements":
            break; // handled later
          case "dictionary":
            if (instruction.partial) {
              break;
            }

            obj = new Dictionary(this.ctx, instruction);
            dictionaries.set(obj.name, obj);
            customTypes.set(obj.name, "dictionary");
            break;
          case "enum":
            obj = new Enumeration(this.ctx, instruction);
            enumerations.set(obj.name, obj);
            customTypes.set(obj.name, "enumeration");
            break;
          case "typedef":
            obj = new Typedef(this.ctx, instruction);
            typedefs.set(obj.name, obj);
            break;
          default:
            if (!this.ctx.options.suppressErrors) {
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

            if (this.ctx.options.suppressErrors && !interfaces.has(instruction.name)) {
              break;
            }
            oldMembers = interfaces.get(instruction.name).idl.members;
            oldMembers.push(...instruction.members);
            extAttrs = interfaces.get(instruction.name).idl.extAttrs;
            extAttrs.push(...instruction.extAttrs);
            break;
          case "dictionary":
            if (!instruction.partial) {
              break;
            }
            if (this.ctx.options.suppressErrors && !dictionaries.has(instruction.name)) {
              break;
            }
            oldMembers = dictionaries.get(instruction.name).idl.members;
            oldMembers.push(...instruction.members);
            extAttrs = dictionaries.get(instruction.name).idl.extAttrs;
            extAttrs.push(...instruction.extAttrs);
            break;
          case "implements":
            if (this.ctx.options.suppressErrors && !interfaces.has(instruction.target)) {
              break;
            }
            interfaces.get(instruction.target).implements(instruction.implements);
            break;
        }
      }
    }
  }

  * _writeFiles(outputDir) {
    const utilsText = yield fs.readFile(path.resolve(__dirname, "output/utils.js"));
    yield fs.writeFile(this.utilPath, utilsText);

    const { interfaces, dictionaries, enumerations } = this.ctx;

    for (const obj of interfaces.values()) {
      let source = obj.toString();

      const implDir = path.relative(outputDir, obj.opts.implDir).replace(/\\/g, "/"); // fix windows file paths
      let implFile = implDir + "/" + obj.name + this.ctx.implSuffix;
      if (implFile[0] !== ".") {
        implFile = "./" + implFile;
      }

      let relativeUtils = path.relative(outputDir, this.utilPath).replace(/\\/g, "/");
      if (relativeUtils[0] !== ".") {
        relativeUtils = "./" + relativeUtils;
      }

      source = `
        "use strict";

        const conversions = require("webidl-conversions");
        const utils = require("${relativeUtils}");
        ${source}
        const Impl = require("${implFile}.js");
      `;

      source = this._prettify(source);

      yield fs.writeFile(path.join(outputDir, obj.name + ".js"), source);
    }

    for (const obj of dictionaries.values()) {
      let source = obj.toString();

      let relativeUtils = path.relative(outputDir, this.utilPath).replace(/\\/g, "/");
      if (relativeUtils[0] !== ".") {
        relativeUtils = "./" + relativeUtils;
      }

      source = `
        "use strict";

        const conversions = require("webidl-conversions");
        const utils = require("${relativeUtils}");
        ${source}
      `;

      source = this._prettify(source);

      yield fs.writeFile(path.join(outputDir, obj.name + ".js"), source);
    }

    for (const obj of enumerations.values()) {
      const source = this._prettify(`
        "use strict";

        ${obj.toString()}
      `);
      yield fs.writeFile(path.join(outputDir, obj.name + ".js"), source);
    }
  }

  _prettify(source) {
    return prettier.format(source, {
      printWidth: 120
    });
  }

  generate(outputDir) {
    if (!this.utilPath) {
      this.utilPath = path.join(outputDir, "utils.js");
    }

    return co(function* () {
      const sources = yield* this._collectSources();
      const contents = yield* this._readFiles(sources);
      this._parse(outputDir, contents);
      yield* this._writeFiles(outputDir);
    }.bind(this));
  }
}

module.exports = Transformer;
