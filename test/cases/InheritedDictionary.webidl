partial dictionary InheritedDictionary {
  DOMString alpha = "partial";
};

dictionary InheritedDictionary : Dictionary {
  sequence<DOMString> empty = [];
  unrestricted double notANumber = NaN;
  unrestricted double positiveInfinity = Infinity;
  unrestricted double negativeInfinity = -Infinity;
  URL? nullable = null;
  long number = 42;
};

partial dictionary InheritedDictionary {
  boolean zebra = true;
};
