// Simplified from https://html.spec.whatwg.org/multipage/dom.html#htmlelement

[Exposed=Window,
 HTMLConstructor]
interface HTMLElement : Element {
  // metadata attributes
  [CEReactions] attribute DOMString title;
  [CEReactions] attribute DOMString lang;
  [CEReactions] attribute boolean translate;
  [CEReactions] attribute DOMString dir;
};
