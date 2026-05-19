[Exposed=(Window,Worker)]
namespace Namespace {
  readonly attribute DOMString version;
  [SameObject] readonly attribute Static staticObject;
  const unsigned short VALUE = 7;
  [CEReactions] undefined configure(DOMString value);
  undefined overloaded(DOMString value);
  undefined overloaded(unsigned long value);
};

partial namespace Namespace {
  [WebIDL2JSCallWithGlobal] Static createStatic();
};
