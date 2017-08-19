# JavaScript bindings generator for Web IDL

webidl2js is a code generator that takes [Web IDL](http://heycam.github.io/webidl/) as input, and generates JavaScript files as output which implement the specified Web IDL semantics. These files implement a "wrapper class", which takes care of all Web IDL-specified behaviors such as type conversions and brand checking, before delegating to an "implementation class" that you provide.

## Example

As a very minimal example, the Web IDL file

```webidl
interface SomeInterface {
  unsigned long long add(unsigned long x, unsigned long y);
}
```

combined with the JavaScript implementation class file

```js
exports.implementation = class {
  add(x, y) {
    return x + y;
  }
};
```

will generate a JavaScript wrapper class file roughly like this:

```js
const conversions = require("webidl-conversions");
const impl = require("./utils.js").implSymbol;

const Impl = require("./SomeInterface-impl.js").implementation;

function SomeInterface() {
  throw new TypeError("Illegal constructor");
}

SomeInterface.prototype.add = function add(x, y) {
  if (!exports.is(this)) {
    throw new TypeError("Illegal invocation");
  }
  if (arguments.length < 2) {
    throw new TypeError(
      "Failed to execute 'add' on 'SomeInterface': 2 arguments required, but only " +
        arguments.length +
        " present."
    );
  }

  const args = [];
  args[0] = conversions["unsigned long"](arguments[0], {
    context: "Failed to execute 'add' on 'SomeInterface': parameter 1"
  });
  args[1] = conversions["unsigned long"](arguments[1], {
    context: "Failed to execute 'add' on 'SomeInterface': parameter 2"
  });

  this[impl].add(...args);
};

Object.defineProperty(SomeInterface.prototype, Symbol.toStringTag, {
  value: "SomeInterface",
  writable: false,
  enumerable: false,
  configurable: true
});

exports.interface = SomeInterface;

exports.create = (constructorArgs = [], privateData = {}) => {
  const obj = Object.create(SomeInterface.prototype);
  obj[impl] = new Impl(constructorArgs, privateData);
  return obj;
};

exports.is = obj => obj && obj[impl] instanceof Impl;
```

The above is a simplification of the actual generated code, but should give you some idea of what's going on. We bring your attention to a few points:

- webidl2js takes pains to fully implement Web IDL semantics. Here you can see some on display, such as:
  - Uncallable constructors, when no `[Constructor]` extended attribute is specified.
  - Brand-checking on operation invocation
  - Argument-length checking for non-optional arguments
  - Argument conversion according to the rules specified in Web IDL for given argument types
  - @@toStringTag semantics to make `Object.prototype.toString.call()` behave correctly
- After performing Web IDL-related processing, webidl2js delegates to the implementation class for the non-boilerplate parts of `add()`. This allows you to focus on writing the interesting parts of the implementation without worrying about types, brand-checking, parameter-processing, etc.
- webidl2js attempts to generate informative error messages using what it knows.

For more examples, you can check out the `test/` directory (with the generated output being in `test/__snapshots__`). Alternately, you can install [jsdom](https://www.npmjs.com/package/jsdom), [whatwg-url](https://www.npmjs.com/package/whatwg-url), or [domexception](https://www.npmjs.com/package/domexception) from npm and check out their source code. (Note that browsing them on GitHub will not work, as we do not check the generated files into Git, but instead generate them as part of publishing the package to npm.)

## Generation API

A typical Node.js script that compiles IDL using webidl2js looks like the following:

```js
"use strict";
const WebIDL2JS = require("webidl2js");

const transformer = new WebIDL2JS({ implSuffix: "-impl" });

transformer.addSource("idl", "impls");
transformer.generate("wrappers").catch(err => {
  console.error(err.stack);
  process.exit(1);
});
```

The main module's default export is a class which you can construct with a few options:

- `implSuffix`: a suffix used, if any, to find files within the source directory based on the IDL file name.
- `suppressErrors`: set to true to suppress errors during generation.

The `addSource()` method can then be called multiple times to add directories containing `.idl` IDL files and `.js` implementation class files.

Finally, the `generate()` method will generate corresponding wrapper class files in the given directory.

In this example, a file at `idl/SomeInterface.idl` would generate a new wrapper class at `wrappers/SomeInterface.js`, which would refer to an implementation class at `impls/SomeInterface-impl.js`. (In practice, usually at least two of these directories are the same, making `implSuffix` a useful option.)

The transformer will also generate a file named `utils.js` inside the wrapper class directory, which contains utilities used by all the wrapper class files.

Note that webidl2js works best when there is a single transformer instance that knows about as many files as possible. This allows it to resolve type references, e.g. when one operation has an argument type referring to some other interface.

## Features

webidl2js is implementing an ever-growing subset of the Web IDL specification. So far we have implemented:

- Interface types, including:
  - Inheritance
  - Attributes
  - Operations
  - Constants
  - Stringifiers
  - `iterable<>` declarations
  - Class strings (with the semantics of [heycam/webidl#357](https://github.com/heycam/webidl/pull/357))
- Dictionary types
- Union types
- Callback function types, somewhat
- Nullable types
- `sequence<>` types
- `record<>` types
- `Promise<>` types
- `FrozenArray<>` types
- `typedef`s
- Partial interfaces and dictionaries
- Basic types (via [webidl-conversions](https://github.com/jsdom/webidl-conversions))
- Mixins, i.e. `implements` (with a [notable bug](https://github.com/jsdom/webidl2js/issues/49))
- Overload resolution (although [tricky cases are not easy on the implementation class](https://github.com/jsdom/webidl2js/issues/29))
- Variadic arguments
- `[Clamp]`
- `[Constructor]`
- `[EnforceRange]`
- `[Exposed]` and `[NoInterfaceObject]` (by exporting metadata on where/whether it is exposed)
- `[PutForwards]`
- `[Replaceable]`
- `[SameObject]` (automatic caching)
- `[TreatNullAs]`
- `[Unforgeable]`
- `[Unscopeable]`

Notable missing features include:

- Legacy platform objects, i.e. those using `getter`/`setter`/`deleter` declarations ([in progress](https://github.com/jsdom/webidl2js/pull/48))
- Namespaces
- Enumeration types ([#28](https://github.com/jsdom/webidl2js/issues/28))
- Callback interfaces
- Named constructors
- `maplike<>` and `setlike<>`
- `[AllowShared]`
- `[Default]` (for `toJSON()` operations)
- `[Global]` and `[PrimaryGlobal]`'s various consequences, including the named properties object and `[[SetPrototypeOf]]`
- `[LegacyArrayClass]`
- `[LegacyUnemerableNamedProperties]`
- `[LegacyWindowAlias]`
- `[LenientSetter]`
- `[LenientThis]`
- `[NamedConstructor]`
- `[OverrideBuiltins]` ([in progress](https://github.com/jsdom/webidl2js/pull/48))
- `[SecureContext]`
- `[TreatNonObjectAsNull]`

## Nonstandard extended attributes

A couple of non-standard extended attributes are baked in to webidl2js.

### `[Reflect]`

The `[Reflect]` extended attribute is used on IDL attributes to implement the rules for [reflecting a content attribute to an IDL attribute](https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflect). If `[Reflect]` is specified, the implementation class does not need to implement any getter or setter logic; webidl2js will take care of it.

By default the attribute passed to `this.getAttribute` and `this.setAttribute` will be the same as the name of the property being reflected. You can use the form `[Reflect=custom]` or `[Reflect=custom_with_dashes]` to change that to be `"custom"` or `"custom-with-dashes"`, respectively.

Note that only the basics of the reflect algorithm are implemented so far: `boolean`, `DOMString`, `long`, and `unsigned long`, with no parametrizations.

In the future we may move this extended attribute out into some sort of plugin, since it is more related to HTML than to Web IDL.

### `[WebIDL2JSFactory]`

This extended attribute can be applied to interfaces to cause them to generate a factory that generates wrapper classes, instead of generating a single wrapper class.

It is currently used by [jsdom](https://github.com/tmpvar/jsdom) for classes which need to specialize their behavior per `Window` object; by default [jsdom shares classes across all `Window`s](https://github.com/tmpvar/jsdom#shared-constructors-and-prototypes), but with `[WebIDL2JSFactory]`, an exception can be made for certain classes that need it.
