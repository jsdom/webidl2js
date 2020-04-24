[Exposed=Window]
interface LegacyLenientAttributes {
  [LegacyLenientSetter] readonly attribute DOMString lenientSetter;
  [LegacyLenientSetter, LenientThis] readonly attribute DOMString lenientThisSetter;

  [LenientThis] attribute DOMString lenientThis;
  [LenientThis] readonly attribute DOMString readonlyLenientThis;
  [LenientThis, Replaceable] readonly attribute DOMString replaceableLenientThis;
};
