[Exposed=Window]
interface BrandCheck : BrandCheckParent {
  constructor();
  DOMString childMethod();
  DOMString shadow(any interfaceDescriptor);
  undefined objectUnion((double or object) value);
};
