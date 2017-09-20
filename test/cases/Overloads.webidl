interface Overloads {
  DOMString compatible(DOMString arg1);
  byte compatible(DOMString arg1, DOMString arg2);
  Promise<DOMString> compatible(DOMString arg1, DOMString arg2, optional long arg3 = 0);

  DOMString incompatible(DOMString arg1);
  byte incompatible(long arg1);
};
