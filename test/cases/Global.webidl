[Global=Global,Exposed=Global]
interface Global {
  undefined op();
  [LegacyUnforgeable] undefined unforgeableOp();
  attribute DOMString attr;
  [LegacyUnforgeable] attribute DOMString unforgeableAttr;

  getter DOMString (unsigned long index);
  attribute unsigned long length;
  iterable<DOMString>;

  static undefined staticOp();
  static attribute DOMString staticAttr;
};
