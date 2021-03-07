// Adapted from HTMLCollection
// https://dom.spec.whatwg.org/#htmlcollection
[Exposed=Window, LegacyUnenumerableNamedProperties]
interface URLSearchParamsCollection {
  readonly attribute unsigned long length;
  [WebIDL2JSValueAsUnsupported=_undefined] getter URLSearchParams? item(unsigned long index);
  [WebIDL2JSValueAsUnsupported=_null] getter URLSearchParams? namedItem(DOMString name);
};
