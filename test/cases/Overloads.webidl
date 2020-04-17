[Exposed=Window]
interface Overloads {
  constructor();
  constructor(DOMString arg1);
  constructor(URL arg1);

  DOMString compatible(DOMString arg1);
  byte compatible(DOMString arg1, DOMString arg2);
  URL compatible(DOMString arg1, DOMString arg2, optional long arg3 = 0);

  DOMString incompatible1(DOMString arg1);
  byte incompatible1(long arg1);

  DOMString incompatible2(DOMString arg1);
  byte incompatible2(DOMString arg1, DOMString arg2);

  DOMString incompatible3(DOMString arg1, optional URL arg2);
  byte incompatible3(DOMString arg1, DOMString arg2);
  byte incompatible3(DOMString arg1, BufferSource arg2);
  byte incompatible3(DOMString arg1, long arg2, BufferSource arg3, BufferSource arg4);
};
