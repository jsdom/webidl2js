// Simplified from https://dom.spec.whatwg.org/#eventtarget

[Exposed=(Window,Worker,AudioWorklet)]
interface EventTarget {
  constructor();

  void addEventListener(DOMString type, EventListener? callback);
  // void removeEventListener(DOMString type, EventListener? callback);
  // boolean dispatchEvent(Event event);
};
