// Simplified from https://dom.spec.whatwg.org/#eventtarget

[Exposed=(Window,Worker,AudioWorklet)]
interface EventTarget {
  constructor();

  undefined addEventListener(DOMString type, EventListener? callback);
  // undefined removeEventListener(DOMString type, EventListener? callback);
  // boolean dispatchEvent(Event event);
};
