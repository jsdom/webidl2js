[Global=Global,Exposed=Global]
interface Global {
  void op();
  [LegacyUnforgeable] void unforgeableOp();
  attribute DOMString attr;
  [LegacyUnforgeable] attribute DOMString unforgeableAttr;

  getter DOMString (unsigned long index);
  attribute unsigned long length;
  iterable<DOMString>;

  static void staticOp();
  static attribute DOMString staticAttr;
};
