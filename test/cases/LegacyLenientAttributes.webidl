[Exposed=Window]
interface LegacyLenientAttributes {
  [LegacyLenientSetter] readonly attribute DOMString lenientSetter;
  [LegacyLenientSetter, LenientThis] readonly attribute DOMString lenientThisSetter;
  [LenientThis] readonly attribute DOMString lenientThis;
  [LenientThis, Replaceable] readonly attribute DOMString replaceableLenientThis;
};
