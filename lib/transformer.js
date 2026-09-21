"use strict";

const path = require("path");

const fs = require("fs/promises");
const webidl = require("webidl2");
const { format } = require("oxfmt");

const Context = require("./context");
const Typedef = require("./constructs/typedef");
const Interface = require("./constructs/interface");
const PartialInterface = require("./constructs/partial-interface");
const Namespace = require("./constructs/namespace");
const InterfaceMixin = require("./constructs/interface-mixin");
const CallbackInterface = require("./constructs/callback-interface.js");
const CallbackFunction = require("./constructs/callback-function");
const Dictionary = require("./constructs/dictionary");
const Enumeration = require("./constructs/enumeration");

class Transformer {
  constructor(opts = {}) {
    const { externalInterfaces = [] } = opts;
    if (!Array.isArray(externalInterfaces) || externalInterfaces.some(name => typeof name !== "string")) {
      throw new TypeError("externalInterfaces must be an array of interface names");
    }
    this.externalInterfaces = new Set(externalInterfaces);
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
    const dirContents = await Promise.all(
      stats.map((stat, i) => {
        return stat.isDirectory() ? fs.readdir(this.sources[i].idlPath) : null;
      })
    );

    const files = [];
    for (let i = 0; i < stats.length; ++i) {
      if (dirContents[i]) {
        for (const file of dirContents[i]) {
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
    this.partialInterfaces = new Map();
    const {
      interfaces,
      namespaces,
      interfaceMixins,
      callbackInterfaces,
      callbackFunctions,
      dictionaries,
      enumerations,
      typedefs
    } = this.ctx;

    // first we're gathering all full definitions and ignore partial ones
    for (const file of parsed) {
      for (const instruction of file.idl) {
        this._validateExternalReferences(instruction);
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
          case "namespace":
            if (instruction.partial) {
              break;
            }

            obj = new Namespace(this.ctx, instruction, {
              implDir: file.impl
            });
            namespaces.set(obj.name, obj);
            break;
          case "interface mixin":
            if (instruction.partial) {
              break;
            }

            obj = new InterfaceMixin(this.ctx, instruction);
            interfaceMixins.set(obj.name, obj);
            break;
          case "callback interface":
            obj = new CallbackInterface(this.ctx, instruction);
            callbackInterfaces.set(obj.name, obj);
            break;
          case "callback":
            obj = new CallbackFunction(this.ctx, instruction);
            callbackFunctions.set(obj.name, obj);
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
              throw new Error(`Can't convert type '${instruction.type}'`);
            }
        }
      }
    }

    // second we add all partial members and handle includes
    for (const file of parsed) {
      for (const instruction of file.idl) {
        let oldMembers, extAttrs;
        switch (instruction.type) {
          case "interface":
            if (!instruction.partial) {
              break;
            }

            if (this.externalInterfaces.has(instruction.name)) {
              const partials = this.partialInterfaces.get(instruction.name) || [];
              const memberNames = new Set(partials.flatMap(partial => partial.idl.members.map(member => member.name)));
              for (const member of instruction.members) {
                if (memberNames.has(member.name)) {
                  throw new Error(`Duplicate member ${member.name} across partial interfaces of ${instruction.name}`);
                }
              }
              partials.push(new PartialInterface(this.ctx, instruction, { implDir: file.impl }));
              this.partialInterfaces.set(instruction.name, partials);
              break;
            }

            if (this.ctx.options.suppressErrors && !interfaces.has(instruction.name)) {
              break;
            }
            if (!interfaces.has(instruction.name)) {
              throw new Error(`Interface ${instruction.name} is not defined; ` +
                              "use externalInterfaces to generate a static partial installer");
            }
            oldMembers = interfaces.get(instruction.name).idl.members;
            oldMembers.push(...instruction.members);
            extAttrs = interfaces.get(instruction.name).idl.extAttrs;
            extAttrs.push(...instruction.extAttrs);
            break;
          case "namespace":
            if (!instruction.partial) {
              break;
            }

            if (this.ctx.options.suppressErrors && !namespaces.has(instruction.name)) {
              break;
            }
            oldMembers = namespaces.get(instruction.name).idl.members;
            oldMembers.push(...instruction.members);
            extAttrs = namespaces.get(instruction.name).idl.extAttrs;
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

  _validateExternalReferences(instruction) {
    if (this.externalInterfaces.has(instruction.name) &&
        !(instruction.type === "interface" && instruction.partial)) {
      throw new Error(`The external interface ${instruction.name} cannot be defined in this generation`);
    }
    if (this.externalInterfaces.has(instruction.inheritance)) {
      throw new Error(`Cannot inherit from external interface ${instruction.inheritance}`);
    }
    if (instruction.type === "includes" && this.externalInterfaces.has(instruction.target)) {
      throw new Error(`Cannot use includes with external interface ${instruction.target}`);
    }

    const visit = node => {
      if (Array.isArray(node)) {
        node.forEach(visit);
      } else if (node && typeof node === "object") {
        if (this.externalInterfaces.has(node.idlType)) {
          throw new Error(`The external interface ${node.idlType} cannot be used as a type`);
        }
        visit(node.idlType);
        visit(node.arguments);
        visit(node.members);
      }
    };
    visit(instruction);
  }

  async _writeFiles(outputDir) {
    const utilsText = await fs.readFile(path.resolve(__dirname, "output/utils.js"));
    await fs.writeFile(this.utilPath, utilsText);

    const { interfaces, namespaces, callbackInterfaces, callbackFunctions, dictionaries, enumerations } = this.ctx;

    let relativeUtils = path.relative(outputDir, this.utilPath).replaceAll("\\", "/");
    if (relativeUtils[0] !== ".") {
      relativeUtils = `./${relativeUtils}`;
    }

    await Promise.all(interfaces.values().map(async obj => {
      let source = obj.toString();

      let implFile = path.relative(outputDir, path.resolve(obj.opts.implDir, obj.name + this.ctx.implSuffix));
      implFile = implFile.replaceAll("\\", "/"); // fix windows file paths
      if (implFile[0] !== ".") {
        implFile = `./${implFile}`;
      }

      source = `
        "use strict";

        const conversions = require("webidl-conversions");
        const utils = require("${relativeUtils}");
        ${source}
        const Impl = require("${implFile}.js");
      `;

      source = await this._prettify(source);

      await fs.writeFile(path.join(outputDir, `${obj.name}.js`), source);
    }));

    await Promise.all(this.partialInterfaces.entries().map(async ([name, partials]) => {
      const installers = partials.map(partial => {
        let implFile = path.relative(outputDir, path.resolve(partial.opts.implDir, name + this.ctx.implSuffix));
        implFile = implFile.replaceAll("\\", "/");
        if (implFile[0] !== ".") {
          implFile = `./${implFile}`;
        }
        return `(() => {
          const Impl = require(${JSON.stringify(`${implFile}.js`)});
          ${partial.toString()}
        })()`;
      });
      const source = await this._prettify(`
        "use strict";
        const conversions = require("webidl-conversions");
        const utils = require("${relativeUtils}");
        const installers = [${installers.join(",")}];
        exports.install = (globalObject, globalNames) => {
          for (const install of installers) {
            install(globalObject, globalNames);
          }
        };
      `);
      await fs.writeFile(path.join(outputDir, `${name}.js`), source);
    }));

    await Promise.all(namespaces.values().map(async obj => {
      let source = obj.toString();

      let implFile = path.relative(outputDir, path.resolve(obj.opts.implDir, obj.name + this.ctx.implSuffix));
      implFile = implFile.replaceAll("\\", "/"); // fix windows file paths
      if (implFile[0] !== ".") {
        implFile = `./${implFile}`;
      }

      source = `
        "use strict";

        const conversions = require("webidl-conversions");
        const utils = require("${relativeUtils}");
        ${source}
        const Impl = require("${implFile}.js");
      `;

      source = await this._prettify(source);

      await fs.writeFile(path.join(outputDir, `${obj.name}.js`), source);
    }));

    await Promise.all(
      [...callbackInterfaces.values(), ...callbackFunctions.values(), ...dictionaries.values()].map(async obj => {
        let source = obj.toString();

        source = `
          "use strict";

          const conversions = require("webidl-conversions");
          const utils = require("${relativeUtils}");
          ${source}
        `;

        source = await this._prettify(source);

        await fs.writeFile(path.join(outputDir, `${obj.name}.js`), source);
      })
    );

    await Promise.all(enumerations.values().map(async obj => {
      const source = await this._prettify(`
        "use strict";

        ${obj.toString()}
      `);
      await fs.writeFile(path.join(outputDir, `${obj.name}.js`), source);
    }));
  }

  async _prettify(source) {
    const { code } = await format("output.js", source, {
      printWidth: 120,
      trailingComma: "none",
      arrowParens: "avoid"
    });
    return code;
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
