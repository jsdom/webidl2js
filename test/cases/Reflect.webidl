[Exposed=Window]
interface Reflect {
  [Reflect] attribute boolean reflectedBoolean;
  [FooBar, Reflect] attribute DOMString reflectedDOMString;
  [Reflect, FooBar] attribute long reflectedLong;
  [Reflect] attribute unsigned long reflectedUnsignedLong;
  [FooBar, ReflectURL] attribute USVString reflectedUSVStringURL;

  [FooBar, Reflect=reflection] attribute DOMString reflectionTest;
  [Reflect=with_underscore, FooBar] attribute DOMString withUnderscore;
};
