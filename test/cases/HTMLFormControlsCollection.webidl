[Exposed=Window]
interface HTMLFormControlsCollection : HTMLCollection {
  // inherits length and item()
  [WebIDL2JSValueAsUnsupported=_null] getter (RadioNodeList or Element)? namedItem(DOMString name); // shadows inherited namedItem()
};
