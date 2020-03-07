[Exposed=(Window,Worker,AudioWorklet)]
interface EventTarget {
  constructor();

  void addEventListener(DOMString type, EventListener? callback, optional any options);
  void removeEventListener(DOMString type, EventListener? callback, optional any options);
  boolean dispatchEvent(Event event);
};
