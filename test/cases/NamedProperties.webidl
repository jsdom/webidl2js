[Exposed=Window]
interface NamedProperties {
  constructor();
  readonly attribute unsigned long length;
  getter DOMString? namedItem(DOMString name);
};
