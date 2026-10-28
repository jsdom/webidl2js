[Exposed=Window]
interface OverloadTypes {
  undefined optionalValue(optional long value = 0);
  undefined optionalValue(DOMString value);

  undefined nullableValue(URL? value);
  undefined nullableValue(DOMString value);

  undefined selfValue(OverloadTypes value);
  undefined selfValue(DOMString value);

  undefined unionValue((URL or URLSearchParams) value);
  undefined unionValue(DOMString value);

  undefined bufferValue(SharedArrayBuffer value);
  undefined bufferValue(Uint8Array value);
  undefined bufferValue(DOMString value);

  undefined callbackValue(Function value);
  undefined callbackValue(DOMString value);

  undefined iterableValue(sequence<DOMString> value);
  undefined iterableValue(DOMString value);

  undefined objectValue(object value);
  undefined objectValue(boolean value);

  undefined numericFallbackValue(URL value);
  undefined numericFallbackValue(long value);

  undefined enumerationValue(RequestDestination value);
  undefined enumerationValue(long value);
};
