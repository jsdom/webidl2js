# JavaScript bindings generator for Web IDL

webidl2js is a code generator that takes [Web IDL](http://heycam.github.io/webidl/) as input, and generates JavaScript files as output which implement the specified Web IDL semantics. These files implement a "wrapper class", which takes care of all Web IDL-specified behaviors such as type conversions and brand checking, before delegating to an "implementation class" that you provide.

## Example

As a very minimal example, the Web IDL file

```webidl
interface SomeInterface {
  unsigned long long add(unsigned long x, unsigned long y);
};
```

combined with the JavaScript implementation class file

```js
exports.implementation = class SomeInterfaceImpl {
  add(x, y) {
    return x + y;
  }
};
```

will generate a JavaScript wrapper class file roughly like this:

```js
const conversions = require("webidl-conversions");
const impl = require("./utils.js").implSymbol;
const ctorRegistry = require("./utils.js").ctorRegistrySymbol;

const Impl = require("./SomeInterface-impl.js").implementation;

class SomeInterface {
  constructor() {
    throw new TypeError("Illegal constructor");
  }

  add(x, y) {
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

    return this[impl].add(...args);
  }
}

Object.defineProperties(SomeInterface.prototype, {
  add: { enumerable: true },
  [Symbol.toStringTag]: { value: "SomeInterface", configurable: true }
});

exports.create = (globalObject, constructorArgs = [], privateData = {}) => {
  const ctor = globalObject[ctorRegistry].SomeInterface;
  const obj = Object.create(ctor.prototype);
  obj[impl] = new Impl(constructorArgs, privateData);
  return obj;
};

exports.is = obj => obj && obj[impl] instanceof Impl;
```

The above is a simplification of the actual generated code, but should give you some idea of what's going on. We bring your attention to a few points:

- webidl2js takes pains to fully implement Web IDL semantics. Here you can see some on display, such as:
  - Uncallable constructors, when no `constructor` operation is specified.
  - Brand-checking on operation invocation
  - Argument-length checking for non-optional arguments
  - Argument conversion according to the rules specified in Web IDL for given argument types
  - Enumerability of operations
  - @@toStringTag semantics to make `Object.prototype.toString.call()` behave correctly
- After performing Web IDL-related processing, webidl2js delegates to the implementation class for the non-boilerplate parts of `add()`. This allows you to focus on writing the interesting parts of the implementation without worrying about types, brand-checking, parameter-processing, etc.
- webidl2js attempts to generate informative error messages using what it knows.

For more examples, you can check out the `test/` directory (with the generated output being in `test/__snapshots__`). Alternately, you can install [jsdom](https://www.npmjs.com/package/jsdom), [whatwg-url](https://www.npmjs.com/package/whatwg-url), or [domexception](https://www.npmjs.com/package/domexception) from npm and check out their source code. (Note that browsing them on GitHub will not work, as we do not check the generated files into Git, but instead generate them as part of publishing the package to npm.)

## Wrapper class file generation API

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

- `implSuffix`: a suffix used, if any, to find files within the source directory based on the IDL file name
- `suppressErrors`: set to true to suppress errors during generation
- `processCEReactions` and `processHTMLConstructor`: see below

The `addSource()` method can then be called multiple times to add directories containing `.webidl` IDL files and `.js` implementation class files.

Finally, the `generate()` method will generate corresponding wrapper class files in the given directory.

In this example, a file at `idl/SomeInterface.webidl` would generate a new wrapper class at `wrappers/SomeInterface.js`, which would refer to an implementation class at `impls/SomeInterface-impl.js`. (In practice, usually at least two of these directories are the same, making `implSuffix` a useful option.)

The transformer will also generate a file named `utils.js` inside the wrapper class directory, which contains utilities used by all the wrapper class files.

Note that webidl2js works best when there is a single transformer instance that knows about as many files as possible. This allows it to resolve type references, e.g. when one operation has an argument type referring to some other interface.

### `[CEReactions]` and `[HTMLConstructor]`

By default webidl2js ignores HTML Standard-defined extended attributes [`[CEReactions]`](https://html.spec.whatwg.org/multipage/custom-elements.html#cereactions) and [`[HTMLConstructor]`](https://html.spec.whatwg.org/multipage/dom.html#htmlconstructor), since they require detailed knowledge of the host environment to implement correctly. The `processCEReactions` and `processHTMLConstructor` hooks provide a way to customize the generation of the wrapper class files when these extended attributes are present.

Both hooks have the signature `(code) => replacementCode`, where:

- `code` (string) is the code generated by webidl2js normally, for calling into the impl class.

- `replacementCode` (string) is the new code that will be output in place of `code` in the wrapper class.

If either hook is omitted, then the code will not be replaced, i.e. the default is equivalent to `(code) => code`.

Both hooks also have a utility method that is accessible via `this`:

- `addImport(path, [importedIdentifier])` utility to require external modules from the generated interface. This method accepts 2 parameters: `path` the relative or absolute path from the generated interface file, and an optional `importedIdentifier` the identifier to import. This method returns the local identifier from the imported path.

The following variables are available in the scope of the replacement code:

- `globalObject` (object) is the global object associated with the interface

- `interfaceName` (string) is the name of the interface

An example of code that uses these hooks is as follows:

```js
"use strict";
const WebIDL2JS = require("webidl2js");

const transformer = new WebIDL2JS({
  implSuffix: "-impl",
  processCEReactions(code) {
    // Add `require("../ce-reactions")` to generated file.
    const ceReactions = this.addImport("../ce-reactions");

    return `
      ${ceReactions}.preSteps(globalObject);
      try {
        ${code}
      } finally {
        ${ceReactions}.postSteps(globalObject);
      }
    `;
  },
  processHTMLConstructor(/* code */) {
    // Add `require("../HTMLConstructor").HTMLConstructor` to generated file.
    const htmlConstructor = this.addImport("../HTMLConstructor", "HTMLConstructor");

    return `
      return ${htmlConstructor}(globalObject, interfaceName);
    `;
  }
});

transformer.addSource("idl", "impls");
transformer.generate("wrappers").catch(err => {
  console.error(err.stack);
  process.exit(1);
});
```

### `[Reflect]`

Many HTML IDL attributes are defined using [reflecting a content attribute to an IDL attribute](https://html.spec.whatwg.org/multipage/common-dom-interfaces.html#reflect). By default webidl2js doesn't do much with reflection, since it requires detailed knowledge of the host environment to implement correctly. However, we offer the `processReflect` processor hook to allow the host environment to automate the task of implementing reflected IDL attributes.

The `processReflect` processor hook has the signature `(idl, implName) => ({ get, set })`, where:

- `idl` is the [`attribute` AST node](https://github.com/w3c/webidl2.js/#attribute-member) as emitted by the [webidl2](https://github.com/w3c/webidl2.js) parser.

- `implName` (string) is a JavaScript expression that would evaluate to the implementation object at runtime.

- `get` (string) is the code that will be output in the attribute getter, after any function prologue.

- `set` (string) is the code that will be output in the attribute setter, after any function prologue.

The hook also has a utility method that is accessible via `this`:

- `addImport(path, [importedIdentifier])` utility to require external modules from the generated interface. This method accepts 2 parameters: `path` the relative or absolute path from the generated interface file, and an optional `importedIdentifier` the identifier to import. This method returns the local identifier from the imported path.

The following variables are available in the scope of the replacement code:

- `globalObject` (object) is the global object associated with the interface

- `interfaceName` (string) is the name of the interface

- (for setter only) `V` (any) is the converted input to the setter method.

To mark an attribute as reflected, an extended attribute whose name starts with `Reflect` should be added to the IDL attribute. This means that any of the following is treated as reflected by webidl2js:

```webidl
[Reflect] attribute boolean reflectedBoolean;
[ReflectURL] attribute USVString reflectedURL;
[Reflect=value, ReflectURL] attribute USVString reflectedValue;
```

webidl2js itself does not particularly care about the particular reflection-related extended attribute(s) being used, only that one exists. However, your processor hook can make use of the extended attributes for additional information on how the attribute is reflected.

An example processor function that implements `boolean` IDL attribute reflection is as follows:

```js
function processReflect(idl, implName) {
  // Assume the name of the reflected content attribute is the same as the IDL attribute, lowercased.
  const attrName = idl.name.toLowerCase();

  if (idl.idlType.idlType === "boolean") {
    return {
      get: `return ${implName}.hasAttributeNS(null, "${attrName}");`,
      set: `
        if (V) {
          ${implName}.setAttributeNS(null, "${attrName}", "");
        } else {
          ${implName}.removeAttributeNS(null, "${attrName}");
        }
      `
    };
  }
  throw new Error(`Not-yet-implemented IDL type for reflection: ${idl.idlType.idlType}`);
}
```

## Generated wrapper class file API

The example above showed a simplified generated wrapper file with only three exports: `create`, `is`, and `interface`. In reality the generated wrapper file will contain more functionality, documented here. This functionality is different between generated wrapper files for interfaces and for dictionaries.

### For interfaces

#### `isImpl(value)`

Returns a boolean indicating whether _value_ is an instance of the corresponding implementation class.

This is especially useful inside implementation class files, where incoming wrappers will be _unwrapped_, so that you only ever see implementation class instances ("impls").

#### `is(value)`

Returns a boolean indicating whether _value_ is an instance of the wrapper class.

This is useful in other parts of your program that are not implementation class files, but instead receive wrapper classes from client code.

#### `convert(value, { context })`

Performs the Web IDL conversion algorithm for this interface, converting _value_ into the correct representation of the interface type suitable for consumption by implementation classes: the corresponding impl.

In practice, this means doing a type-check equivalent to `is(value)`, and if it passes, returns the corresponding impl. If the type-check fails, it throws an informative exception. _context_ can be used to describe the provided value in any resulting error message.

#### `install(globalObject)`

This method creates a brand new wrapper constructor and prototype and attach it to the passed `globalObject`. It also registers the created constructor with the `globalObject`'s global constructor registry, which makes `create()`, `createImpl()`, and `setup()` work. (Thus, it is important to invoke `install()` before invoking those methods, as otherwise they will throw.)

#### `create(globalObject, constructorArgs, privateData)`

Creates a new instance of the wrapper class and corresponding implementation class, passing in the `globalObject`, the `constructorArgs` array and `privateData` object to the implementation class constructor. Then returns the wrapper class.

This is useful in other parts of your program that are not implementation class files, but instead want to interface with them from the outside. It's also mostly useful when creating instances of classes that do not have a `constructor`, i.e. are not constructible via their wrapper class constructor.

#### `createImpl(globalObject, constructorArgs, privateData)`

Creates a new instance of the wrapper class and corresponding implementation class, passing in the `globalObject`, the `constructorArgs` array and `privateData` object to the implementation class constructor. Then returns the implementation class.

This is useful inside implementation class files, where it is easiest to only deal with impls, not wrappers.

#### `setup(obj, globalObject, constructorArgs, privateData)`

This function is mostly used internally, and almost never should be called by your code. The one exception is if you need to inherit from a wrapper class corresponding to an interface without a `constructor`, from a non-webidl2js-generated class. Then, you can call `SuperClass.setup(this, globalObject, [], privateData)` as a substitute for doing `super()` (which would throw).

jsdom does this for `Window`, which is written in custom, non-webidl2js-generated code, but inherits from `EventTarget`, which is generated by webidl2js.

### For dictionaries

#### `convert(value, { context })`

Performs the Web IDL conversion algorithm for this dictionary, converting _value_ into the correct representation of the dictionary type suitable for consumption by implementation classes: a `null`-[[Prototype]] object with its properties properly converted.

If any part of the conversion fails, _context_ can be used to describe the provided value in any resulting error message.

## Writing implementation class files

webidl2js tries to ensure that your hand-authored implementation class files can be as straightforward as possible, leaving all the boilerplate in the generated wrapper file.

Implementation class files contain a single export, `implementation`, whose value is the implementation class. (See [#59](https://github.com/jsdom/webidl2js/issues/59) for potentially making this the default export instead.) The class will contain the following elements:

### The constructor

A constructor for your implementation class, with signature `(globalObject, constructorArgs, privateData)` can serve several purposes:

- Setting up initial state that will always be used, such as caches or default values
- Keep a reference to the relevant `globalObject` for later consumption.
- Processing constructor arguments `constructorArgs` passed to the wrapper class constructor, if the interface in question has a `constructor` operation.
- Processing any private data `privateData` which is provided when other parts of your program use the generated `create()` or `createImpl()` exports of the wrapper class file. This is useful for constructing instances with specific state that cannot be constructed via the wrapper class constructor.

If you don't need to do any of these things, the constructor is entirely optional.

### Methods implementing IDL operations

IDL operations that you wish to implement need to have corresponding methods on the implementation class.

The wrapper class will take care of type conversions for the arguments, so you can operate on the incoming data assuming it is converted to the appropriate Web IDL type. You can also assume that your `this` value is an implementation class; appropriate brand-checking was performed by the wrapper class.

The wrapper class will even convert any implementation classes you return to the corresponding wrapper classes. This allows you to usually stay entirely within the realm of impls and never deal with wrappers yourself.

However, note that apart from Web IDL container return values, this impl-back-to-wrapper conversion doesn't work in a "deep" fashion. That is, if you directly return an impl, or return an array or object containing impls from a `sequence<>`, `FrozenArray<>`, or `record<>`-returning operation, the conversion will work. But if you return some other container (such as your own `NodeList` implementation) containing impls, the impl classes will escape to your consumers. To fix this, you'll need to manually use the `wrapperFromImpl` util to ensure consumers only ever see wrappers.

The same holds true in reverse: if you accept some other container as an argument, then webidl2js will not automatically be able to find all the wrappers it contains an convert them into impls; you will need to use `implFromWrapper` before processing them.

Variadic operations are fully supported by webidl2js.

#### Overloaded operations

In the case of overloaded operations, webidl2js is not always as helpful as it could be. Due to the fact that JavaScript does not have a C++-like method overloading system, all overloads of a method are dispatched to the same implementation method, which means that the implementation class would need to do some secondary overload resolution to determine which overload is actually called.

#### Static operations

IDL static operations are declared as properties on the constructor, to mimic how the generated class works. This makes using `class` syntax especially idiomatic for defining an interface implementation, as you can just use `static` methods.

### Properties implementing IDL attributes

IDL attributes that you wish to implement need to have corresponding properties on the implementation class. As with operations, the wrapper class will take care of type conversions for setter arguments, and convert any impls you return into wrappers.

Note that for IDL attributes that are `readonly`, these properties do not need to be accessor properties. If you create a data property with the correct name, the wrapper class will still expose the property to consumers as a getter wrapping your implementation class's data property. This can sometimes be more convenient.

#### Static attributes

Just like static operations, static attributes are defined as properties on the constructor of the implementation class. And just like other attributes, the attribute can either be implemented as an accessor attribute or (if it is readonly) a data attribute.

### toString method implementing IDL stringifier

Web IDL allows stringifiers to be either *aliased* to a specific attribute or named operation, or *standalone*. If the interface defines a standalone stringifier, the implementation class should define a string-returning `toString` method implementing the stringification behavior of that interface. The method is not needed if the stringifier is aliased: webidl2js will just call the attribute getter or named operation for stringification.

```webidl
stringifier;                                 // `toString()` is needed on the implementation class.
stringifier attribute DOMString attr;        // `toString()` is not needed.
stringifier           DOMString operation(); // `toString()` is not needed.
```

### Indexed and named properties

IDL indexed and named properties require multiple things on the implementation class to work properly.

The first is the getters, (optional) setters, and (optional) deleters operations. Much like stringifiers, getters, setters, and deleters can either be standalone or aliased to a named operation (though not an attribute). If an operation is standalone, then the implementation class must implement following symbol-named methods. The `utils` object below refers to the default export from the generated utilities file `utils.js`.

- Getters: `utils.indexedGet`, `utils.namedGet`
- Setters: `utils.indexedSetNew`, `utils.indexedSetExisting`, `utils.namedSetNew`, `utils.namedSetExisting`
- Deleters: `utils.namedDelete`

The second is the interface's supported property indices/names. By default, the implementation class should implement both a Boolean-returning `utils.supportsPropertyIndex`/`utils.supportsPropertyName` method that takes a single Number or String argument, respectively, and an iterable-returning `utils.supportedPropertyIndices`/`utils.supportedPropertyNames` for each variety of getters the interface exposes.

If the getter function always returns a constant value for unsupported properties, webidl2js also offers a non-standard extended attribute `[WebIDL2JSValueAsUnsupported]` (documented below) that would simply call the getter function to check if a property index/name is supported, so that `supportsPropertyIndex`/`supportsPropertyName` would not need to be implemented separately. However, when using the extended attribute, be very sure that the value specified in the attribute is returned *if and only if* the property is unsupported.

### Other, non-exposed data and functionality

Your implementation class can contain other properties and methods in support of the wrapped properties and methods that the wrapper class calls into. These can be used to factor out common algorithms, or store private state, or keep caches, or anything of the sort.

Because of the intermediary wrapper class, there is no need to be concerned about these properties and methods being exposed to consumers of the wrappers. As such, you can name them whatever you want. We often conventionally use a leading underscore prefix, so as to make it clearer that unprefixed class members are exposed and prefixed ones are not. But this is just a convention; no matter what name you use, they will not be visible to wrapper class users.

### Inheritance

It is often useful for implementation class files to inherit from each other, if the corresponding IDL interfaces do. This gives a usually-appropriate implementation of all the inherited operations and attributes.

However, it is not required! The wrapper classes will have a correct inheritance chain, regardless of the implementation class inheritance chain. Just make sure that, either via inheritance or manual implementation, you implement all of the expected operations and attributes.

### Other requirements

The generated interface wrapper files use modern JavaScript features such as `class` definitions and `Proxy`. They will not work on JavaScript runtimes that do not support the ECMAScript 2015 standard.

## The generated utilities file

Along with the generated wrapper class files, webidl2js will also generate a utilities file, `utils.js`, in the same directory. (We may make the name less generic; see [#52](https://github.com/jsdom/webidl2js/issues/52) for this and other concerns.) This contains several functions for converting between wrapper and implementation classes.

Using these functions should be rare, in ideal circumstances. Most of the time, you can operate entirely on wrapper classes from the outside, and entirely on implementation classes while writing implementation class code. But, exceptions exist, such as when needing to reach into the internals of a class you only have the wrapper of, or dealing with unusual containers inside your implementation classes (as explained above).

### `wrapperForImpl(impl)`

Returns the corresponding wrapper class instance for a given implementation class instance, or `null` if the argument is not an implementation class instance.

### `tryWrapperForImpl(value)`

Returns the corresponding wrapper class instance for a given implementation class instance, or returns the argument back if it is not a wrapper class instance.

This is useful for scenarios when you are not sure whether your incoming value is an impl, wrapper, or some other value, and just want to ensure that you don't end up with an impl. An example is exposing values to consumers who don't know anything about webidl2js.

### `implForWrapper(wrapper)`

Returns the corresponding impl class instance for a given wrapper class instance, or `null` if the argument is not a wrapper class instance.

This can be useful when you are given a wrapper, but need to modify its inaccessible internals hidden inside the corresponding impl.

### `tryImplForWrapper(value)`

Returns the corresponding impl class instance for a given wrapper class instance, or returns the argument back if it is not an implementation class instance.

## Web IDL features

webidl2js is implementing an ever-growing subset of the Web IDL specification. So far we have implemented:

- Interface types, including:
  - Inheritance
  - Attributes
  - Operations
  - Constants
  - Stringifiers
  - Named and indexed `getter`/`setter`/`deleter` declarations
  - `iterable<>` declarations
  - Class strings (with the semantics of [heycam/webidl#357](https://github.com/heycam/webidl/pull/357))
- Dictionary types
- Enumeration types
- Union types
- Callback function types, somewhat
- Nullable types
- `sequence<>` types
- `record<>` types
- `Promise<>` types
- `FrozenArray<>` types
- `typedef`s
- Partial interfaces and dictionaries
- Interface mixins
- Basic types (via [webidl-conversions][])
- Overload resolution (although [tricky cases are not easy on the implementation class](#overloaded-operations))
- Variadic arguments
- `[Clamp]`
- `[EnforceRange]`
- `[LegacyArrayClass]`
- `[LegacyUnenumerableNamedProperties]`
- `[OverrideBuiltins]`
- `[PutForwards]`
- `[Replaceable]`
- `[SameObject]` (automatic caching)
- `[TreatNullAs]`
- `[Unforgeable]`
- `[Unscopable]`

Supported Web IDL extensions defined in HTML:

- `[CEReactions]` - behavior can be defined via the `processCEReactions` hook
- `[HTMLConstructor]` - behavior can be defined via the `processHTMLConstructor` hook

Notable missing features include:

- Namespaces
- Callback interfaces
- `maplike<>` and `setlike<>`
- `[AllowShared]`
- `[Default]` (for `toJSON()` operations)
- `[Global]`'s various consequences, including the named properties object and `[[SetPrototypeOf]]`
- `[Exposed]`
- `[LegacyWindowAlias]`
- `[LenientSetter]`
- `[LenientThis]`
- `[NamedConstructor]`
- `[SecureContext]`
- `[TreatNonObjectAsNull]`

## Nonstandard extended attributes

One non-standard extended attribute is baked in to webidl2js:

### `[WebIDL2JSValueAsUnsupported=value]`

This extended attribute can be applied to named or indexed getters or setters. It says that whether the interface supports a given property name/index can be automatically derived by looking at the return value of its indexed getter/setter: whenever `value` is returned, the name/index is unsupported. Typically, `value` is either `undefined` or `_null`.

In practice, this means that the implementation class only needs to implement a single method (the named/indexed getter method), and doesn't need to implement the `[idlUtils.supportsPropertyName]()` or `[idlUtils.supportsPropertyIndex]()` method separately.

[webidl-conversions]: https://github.com/jsdom/webidl-conversions
