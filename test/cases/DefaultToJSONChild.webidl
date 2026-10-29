[Exposed=(Window,Worker)]
interface DefaultToJSONChild : DefaultToJSONMiddle {
  constructor();
  inherit attribute JSONNumber x;
  readonly attribute DOMString child;
};

partial interface DefaultToJSONChild {
  readonly attribute DOMString partialValue;
};

interface mixin JSONMixin {
  readonly attribute DOMString mixedIn;
  [Default] object toJSON();
};

DefaultToJSONChild includes JSONMixin;
