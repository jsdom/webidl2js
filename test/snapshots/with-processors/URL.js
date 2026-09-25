"use strict";

const conversions = require("webidl-conversions");
const utils = require("./utils.js");

const ctorRegistrySymbol = utils.ctorRegistrySymbol;

const interfaceName = "URL";

const $interfaceDescriptor = utils.createInterfaceDescriptor();
exports.interfaceDescriptor = $interfaceDescriptor;

exports.is = value => {
  return utils.implForWrapperWithInterface(value, $interfaceDescriptor) !== null;
};
exports.isImpl = value => {
  return utils.isObject(value) && value instanceof Impl.implementation;
};
exports.convert = (globalObject, value, { context = "The provided value" } = {}) => {
  const impl = utils.implForWrapperWithInterface(value, $interfaceDescriptor);
  if (impl !== null) {
    return impl;
  }
  throw new globalObject.TypeError(`${context} is not of type 'URL'.`);
};

function makeWrapper(globalObject, newTarget) {
  let proto;
  if (newTarget !== undefined) {
    proto = newTarget.prototype;
  }

  if (!utils.isObject(proto)) {
    proto = globalObject[ctorRegistrySymbol]["URL"].prototype;
  }

  return Object.create(proto);
}

exports.create = (globalObject, constructorArgs, privateData) => {
  const wrapper = makeWrapper(globalObject);
  return exports.setup(wrapper, globalObject, constructorArgs, privateData);
};

exports.createImpl = (globalObject, constructorArgs, privateData) => {
  const wrapper = exports.create(globalObject, constructorArgs, privateData);
  return utils.implForWrapper(wrapper);
};

exports._internalSetup = (wrapper, globalObject) => {};

exports.setup = (wrapper, globalObject, constructorArgs = [], privateData = {}) => {
  privateData.wrapper = wrapper;

  exports._internalSetup(wrapper, globalObject);
  const impl = new Impl.implementation(globalObject, constructorArgs, privateData);

  utils.registerWrapper(wrapper, impl, $interfaceDescriptor);
  impl[utils.wrapperSymbol] = wrapper;
  if (Impl.init) {
    Impl.init(impl);
  }
  return wrapper;
};

exports.new = (globalObject, newTarget) => {
  const wrapper = makeWrapper(globalObject, newTarget);

  exports._internalSetup(wrapper, globalObject);
  const impl = Object.create(Impl.implementation.prototype);

  utils.registerWrapper(wrapper, impl, $interfaceDescriptor);
  impl[utils.wrapperSymbol] = wrapper;
  if (Impl.init) {
    Impl.init(impl);
  }
  return impl;
};

const exposed = new Set(["Window", "Worker"]);

exports.install = (globalObject, globalNames) => {
  if (!globalNames.some(globalName => exposed.has(globalName))) {
    return;
  }

  const ctorRegistry = utils.initCtorRegistry(globalObject);
  class URL {
    constructor(url) {
      if (arguments.length < 1) {
        throw new globalObject.TypeError(
          `Failed to construct 'URL': 1 argument required, but only ${arguments.length} present.`
        );
      }
      const args = [];
      {
        let curArg = arguments[0];
        curArg = conversions["USVString"](curArg, {
          context: "Failed to construct 'URL': parameter 1",
          globals: globalObject
        });
        args.push(curArg);
      }
      {
        let curArg = arguments[1];
        if (curArg !== undefined) {
          curArg = conversions["USVString"](curArg, {
            context: "Failed to construct 'URL': parameter 2",
            globals: globalObject
          });
        }
        args.push(curArg);
      }
      return exports.setup(Object.create(new.target.prototype), globalObject, args);
    }

    toJSON() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "toJSON"
      );
      return $impl.toJSON();
    }

    get href() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get href"
      );
      return $impl["href"];
    }

    set href(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set href"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'href' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["href"] = V;
    }

    toString() {
      const $impl = utils.requireImplForWrapper(this, $interfaceDescriptor, globalObject, "URL", "toString");

      return $impl["href"];
    }

    get origin() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get origin"
      );
      return $impl["origin"];
    }

    get protocol() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get protocol"
      );
      return $impl["protocol"];
    }

    set protocol(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set protocol"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'protocol' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["protocol"] = V;
    }

    get username() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get username"
      );
      return $impl["username"];
    }

    set username(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set username"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'username' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["username"] = V;
    }

    get password() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get password"
      );
      return $impl["password"];
    }

    set password(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set password"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'password' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["password"] = V;
    }

    get host() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get host"
      );
      return $impl["host"];
    }

    set host(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set host"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'host' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["host"] = V;
    }

    get hostname() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get hostname"
      );
      return $impl["hostname"];
    }

    set hostname(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set hostname"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'hostname' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["hostname"] = V;
    }

    get port() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get port"
      );
      return $impl["port"];
    }

    set port(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set port"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'port' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["port"] = V;
    }

    get pathname() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get pathname"
      );
      return $impl["pathname"];
    }

    set pathname(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set pathname"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'pathname' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["pathname"] = V;
    }

    get search() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get search"
      );
      return $impl["search"];
    }

    set search(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set search"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'search' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["search"] = V;
    }

    get searchParams() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get searchParams"
      );
      return utils.getSameObject(this, "searchParams", () => {
        return utils.tryWrapperForImpl($impl["searchParams"]);
      });
    }

    get hash() {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "get hash"
      );
      return $impl["hash"];
    }

    set hash(V) {
      const $impl = utils.requireImplForWrapper(
        this ?? globalObject,
        $interfaceDescriptor,
        globalObject,
        "URL",
        "set hash"
      );

      V = conversions["USVString"](V, {
        context: "Failed to set the 'hash' property on 'URL': The provided value",
        globals: globalObject
      });

      $impl["hash"] = V;
    }
  }
  Object.defineProperties(URL.prototype, {
    toJSON: { enumerable: true },
    href: { enumerable: true },
    toString: { enumerable: true },
    origin: { enumerable: true },
    protocol: { enumerable: true },
    username: { enumerable: true },
    password: { enumerable: true },
    host: { enumerable: true },
    hostname: { enumerable: true },
    port: { enumerable: true },
    pathname: { enumerable: true },
    search: { enumerable: true },
    searchParams: { enumerable: true },
    hash: { enumerable: true },
    [Symbol.toStringTag]: { value: "URL", configurable: true }
  });
  ctorRegistry[interfaceName] = URL;

  Object.defineProperty(globalObject, interfaceName, {
    configurable: true,
    writable: true,
    value: URL
  });

  if (globalNames.includes("Window")) {
    Object.defineProperty(globalObject, "webkitURL", {
      configurable: true,
      writable: true,
      value: URL
    });
  }
};

const Impl = require("../implementations/URL.js");
