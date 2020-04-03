[Exposed=Window]
interface CEReactions {
    [CEReactions] attribute DOMString attr;
    [CEReactions] void method();

    getter DOMString (DOMString name);
    [CEReactions] setter void (DOMString name, DOMString value);
    [CEReactions] deleter void (DOMString name);
};
