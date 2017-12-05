// imitates the Window interface
[PrimaryGlobal, LegacyUnenumerableNamedProperties] 
interface PrimaryGlobal : URL {
  attribute DOMString name;
  readonly attribute URL url;
  [Unforgeable] readonly attribute URL unforgeableURL;
  [Replaceable] readonly attribute URLList replaceableURLList;

  void close();
  getter object (DOMString name);
};
