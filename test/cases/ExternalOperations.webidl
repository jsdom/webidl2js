[Exposed=Window]
partial interface ExternalOperations {
  [WebIDL2JSCallWithGlobal] static any currentGlobal();
  static DOMString stringify(DOMString value);
  static DOMString choose(DOMString value);
  static DOMString choose(long value);
  static any unwrap(BrandCheck value);
  static Promise<undefined> promise(DOMString value);
};
