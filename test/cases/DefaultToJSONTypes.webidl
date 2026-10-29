typedef DOMString JSONText;
typedef JSONText? NullableJSONText;
typedef Function JSONHandler;

dictionary JSONBase {
  JSONText text;
};

dictionary JSONOptions : JSONBase {
  sequence<DefaultToJSONMiddle> children;
};

dictionary NonJSONOptions {
  JSONHandler handler;
};

dictionary NonJSONChildOptions : NonJSONOptions {
  long value;
};

dictionary RecursiveJSONOptions {
  sequence<RecursiveJSONOptions> children;
};

dictionary RecursiveNonJSONOptions {
  sequence<RecursiveNonJSONOptions> children;
  JSONHandler handler;
};

[Exposed=Window]
interface StaticToJSON {
  static object toJSON();
};

[Exposed=Window]
interface DefaultToJSONTypes {
  readonly attribute NullableJSONText text;
  readonly attribute RequestDestination enumValue;
  readonly attribute DefaultToJSONMiddle? inherited;
  readonly attribute (DefaultToJSONMiddle or DOMString) interfaceUnion;
  readonly attribute sequence<JSONText> sequenceValue;
  readonly attribute FrozenArray<RequestDestination> frozenEnums;
  readonly attribute record<DOMString, sequence<DefaultToJSONMiddle>> recordValue;
  readonly attribute JSONOptions dictionaryValue;
  readonly attribute RecursiveJSONOptions recursiveDictionary;
  readonly attribute DOMRect? nonJSONInterface;
  readonly attribute StaticToJSON nonJSONStatic;
  readonly attribute NonJSONChildOptions nonJSONDictionary;
  readonly attribute RecursiveNonJSONOptions nonJSONRecursiveDictionary;
  readonly attribute sequence<JSONHandler> nonJSONSequence;
  readonly attribute FrozenArray<JSONHandler> nonJSONFrozenArray;
  readonly attribute record<DOMString, JSONHandler> nonJSONRecord;
  readonly attribute CallbackInterfaceTypes nonJSONCallbackInterface;
  readonly attribute ArrayBuffer buffer;
  [Default] object toJSON();
};
