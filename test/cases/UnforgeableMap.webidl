[Exposed=Window]
interface UnforgeableMap {
  [LegacyUnforgeable] readonly attribute DOMString a;
  getter DOMString (DOMString x);
  setter DOMString (DOMString x, DOMString y);
};
