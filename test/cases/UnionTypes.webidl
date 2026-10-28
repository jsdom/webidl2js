[Exposed=Window]
interface UnionTypes {
  undefined dictionaryValue((Dictionary or DOMString) value);
  undefined iterableOrDictionaryValue((sequence<DOMString> or Dictionary) value);
  undefined asyncIterableValue((async_sequence<DOMString> or boolean) value);
  undefined frozenArrayValue((FrozenArray<DOMString> or boolean) value);
  undefined booleanOrNumberValue((boolean or long) value);
  undefined selfValue((UnionTypes or DOMString) value);
  undefined unknownValue((UnknownInterface or DOMString) value);
};
