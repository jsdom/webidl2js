[Exposed=Window,
 HTMLConstructor]
interface HTMLConstructor {
  [SameObject] readonly attribute DOMStringMap dataset;

  void click();
  void focus(optional FocusOptions options);
  void blur();
  readonly attribute DOMString accessKeyLabel;
};