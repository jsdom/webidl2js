[Exposed=Window]
interface DictionaryConvert {
  // Test force-conversion of dictionary types.
  DOMString op(optional DOMString arg1, optional Dictionary arg2);
};
