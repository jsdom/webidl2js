"use strict";

const path = require("path");

const fs = require("fs").promises;
const webidl = require("webidl2");
const prettier = require("prettier");

const Context = require("./context");
const Typedef = require("./constructs/typedef");
const Interface = require("./constructs/interface");
const InterfaceMixin = require("./constructs/interface-mixin");
const Dictionary = require("./constructs/dictionary");
const Enumeration = require("./constructs/enumeration");

class Transformer {
  constructor(opts = {}) {
    this.ctx = new Context({
      implSuffix: opts.implSuffix,
      processCEReactions: opts.processCEReactions,
      processHTMLConstructor: opts.processHTMLConstructor,
      processReflect: opts.processReflect,
      options: {
        suppressErrors: Boolean(opts.suppressErrors)
      }
    });

    this.sources = []; // Absolute paths to the IDL and Impl directories.
    this.utilPath = null;
  }

  addSource(idl, impl) {
    if (typeof idl !== "string") {
      throw new TypeError("idl path has to be a string");
    }
    if (typeof impl !== "string") {
      throw new TypeError("impl path has to be a string");
    }
    this.sources.push({ idlPath: path.resolve(idl), impl: path.resolve(impl) });
    return this;
  }

  async _collectSources() {
    const stats = await Promise.all(this.sources.map(src => fs.stat(src.idlPath)));
    const files = [];
    for (let i = 0; i < stats.length; ++i) {
      if (stats[i].isDirectory()) {
        const folderContents = await fs.readdir(this.sources[i].idlPath);
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

  async _readFiles(files) {
    const zipped = [];
    const fileContents = await Promise.all(files.map(f => fs.readFile(f.idlPath, { encoding: "utf-8" })));
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
    const { interfaces, interfaceMixins, dictionaries, enumerations, typedefs } = this.ctx;

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
              implDir: file.impl
            });
            interfaces.set(obj.name, obj);
            break;
          case "interface mixin":
            if (instruction.partial) {
              break;
            }

            obj = new InterfaceMixin(this.ctx, instruction);
            interfaceMixins.set(obj.name, obj);
            break;
          case "includes":
            break; // handled later
          case "dictionary":
            if (instruction.partial) {
              break;
            }

            obj = new Dictionary(this.ctx, instruction);
            dictionaries.set(obj.name, obj);
            break;
          case "enum":
            obj = new Enumeration(this.ctx, instruction);
            enumerations.set(obj.name, obj);
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

    // second we add all partial members and handle includes
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
          case "interface mixin":
            if (!instruction.partial) {
              break;
            }

            if (this.ctx.options.suppressErrors && !interfaceMixins.has(instruction.name)) {
              break;
            }
            oldMembers = interfaceMixins.get(instruction.name).idl.members;
            oldMembers.push(...instruction.members);
            extAttrs = interfaceMixins.get(instruction.name).idl.extAttrs;
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
          case "includes":
            if (this.ctx.options.suppressErrors && !interfaces.has(instruction.target)) {
              break;
            }
            interfaces.get(instruction.target).includes(instruction.includes);
            break;
        }
      }
    }
  }

  async _writeFiles(outputDir) {
    const utilsText = await fs.readFile(path.resolve(__dirname, "output/utils.js"));
    await fs.writeFile(this.utilPath, utilsText);

    const { interfaces, dictionaries, enumerations } = this.ctx;

    for (const obj of interfaces.values()) {
      let source = obj.toString();

      let implFile = path.relative(outputDir, path.resolve(obj.opts.implDir, obj.name + this.ctx.implSuffix));
      implFile = implFile.replace(/\\/g, "/"); // fix windows file paths
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

      await fs.writeFile(path.join(outputDir, obj.name + ".js"), source);
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

      await fs.writeFile(path.join(outputDir, obj.name + ".js"), source);
    }

    for (const obj of enumerations.values()) {
      const source = this._prettify(`
        "use strict";

        ${obj.toString()}
      `);
      await fs.writeFile(path.join(outputDir, obj.name + ".js"), source);
    }
  }

  _prettify(source) {
    return prettier.format(source, {
      printWidth: 120,
      trailingComma: "none",
      arrowParens: "avoid",
      parser: "babel"
    });
  }

  async generate(outputDir) {
    if (!this.utilPath) {
      this.utilPath = path.join(outputDir, "utils.js");
    }

    const sources = await this._collectSources();
    const contents = await this._readFiles(sources);
    this._parse(outputDir, contents);
    await this._writeFiles(outputDir);
  }
}

module.exports = Transformer;
