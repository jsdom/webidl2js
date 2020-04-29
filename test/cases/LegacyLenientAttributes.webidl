[Exposed=Window]
interface LegacyLenientAttributes {
  [LegacyLenientSetter] readonly attribute DOMString lenientSetter;
  [LegacyLenientSetter, LegacyLenientThis] readonly attribute DOMString lenientThisSetter;

  [LegacyLenientThis] attribute DOMString lenientThis;
  [LegacyLenientThis] readonly attribute DOMString readonlyLenientThis;
  [LegacyLenientThis, Replaceable] readonly attribute DOMString replaceableLenientThis;
};
