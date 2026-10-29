typedef unrestricted double JSONNumber;

[Exposed=(Window,Worker)]
interface DefaultToJSON {
  constructor();
  attribute JSONNumber x;
  readonly attribute boolean enabled;
  [Reflect] readonly attribute DOMString? label;
  readonly attribute object payload;
  readonly attribute DefaultToJSON? nested;
  readonly attribute (DOMString or long) choice;
  readonly attribute FrozenArray<DOMString> names;
  readonly attribute any ignored;
  readonly attribute Promise<DOMString> promise;
  readonly attribute Function handler;
  readonly attribute (DOMString or Function) nonJSONUnion;
  [Exposed=Worker] readonly attribute long workerOnly;
  static readonly attribute long staticValue;
  const long CONSTANT = 1;
  [Default] object toJSON();
};
