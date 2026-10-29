[Exposed=(Window,Worker)]
interface DefaultToJSONMiddle : DefaultToJSON {
  constructor();
  readonly attribute DOMString middle;
};
