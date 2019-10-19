[Exposed=Window]
interface Reflect {
  [Reflect] attribute boolean ReflectedBoolean;
  [FooBar, Reflect] attribute DOMString ReflectedDOMString;
  [Reflect, FooBar] attribute long ReflectedLong;
  [Reflect] attribute unsigned long ReflectedUnsignedLong;

  [FooBar, Reflect=reflection] attribute DOMString ReflectionTest;
  [Reflect=with_underscore, FooBar] attribute DOMString withUnderscore;
};
