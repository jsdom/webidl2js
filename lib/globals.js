"use strict";
const utils = require("./utils.js");

class Globals {
  constructor(ctx) {
    this.ctx = ctx;
    this.requires = new utils.RequiresMap(ctx);

    this.str = null;

    this._analyzed = false;
    this._constructs = null;
  }

  _analyzeMembers() {
    const { ctx } = this;

    const constructs = [];

    // This is needed to ensure that the interface order is deterministic
    // regardless of filesystem case sensitivity:
    const ifaceNames = [...ctx.interfaces.keys(), ...ctx.callbackInterfaces.keys()].sort();

    function addExtendingInterfaces(parent) {
      for (const ifaceName of ifaceNames) {
        const iface = ctx.interfaces.get(ifaceName);
        if (iface && iface.idl.inheritance === parent.name) {
          constructs.push(iface);
          addExtendingInterfaces(iface);
        }
      }
    }

    for (const ifaceName of ifaceNames) {
      const cb = ctx.callbackInterfaces.get(ifaceName);
      if (cb) {
        // Callback interface
        if (cb.constants.size > 0) {
          constructs.push(cb);
        }
        continue;
      }

      const iface = ctx.interfaces.get(ifaceName);
      if (!iface.idl.inheritance) {
        constructs.push(iface);
        addExtendingInterfaces(iface);
      }
    }

    this._constructs = constructs;
  }

  generate() {
    this.generateInterfaces();
    this.generateInstall();
    this.generateRequires();
  }

  generateInterfaces() {
    this.str += `
      /**
       * This object defines the mapping between the interface name and the generated interface wrapper code.
       *
       * Note: The mapping needs to stay as-is in order due to interface evaluation.
       * We cannot "refactor" this to something less duplicative because that would break bundlers which depend
       * on static analysis of require()s.
       */
      exports.interfaces = {
    `;

    for (const { name } of this._constructs) {
      this.str += `${utils.stringifyPropertyKey(name)}: require("./${name}.js"),`;
    }

    this.str += `
      };
    `;
  }

  generateInstall() {
    this.str += `
      /**
       * Initializes the passed object as a new global.
       *
       * The object is expected to contain all the global object properties
       * as specified in the ECMAScript specification.
       *
       * This function has to be added to the exports object
       * to avoid circular dependency issues.
       */
      exports.installInterfaces = (globalObject, globalNames) => {
        for (const iface of Object.values(exports.interfaces)) {
          iface.install(globalObject, globalNames);
        }
      };
    `;
  }

  generateRequires() {
    this.str = `
      ${this.requires.generate()}

      ${this.str}
    `;
  }

  toString() {
    this.str = "";
    if (!this._analyzed) {
      this._analyzed = true;
      this._analyzeMembers();
    }
    this.generate();
    return this.str;
  }
}

module.exports = Globals;
