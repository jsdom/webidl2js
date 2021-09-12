[Exposed=Window]
interface CEReactions {
    [CEReactions] attribute DOMString attr;
    [CEReactions] undefined method();

    getter DOMString (DOMString name);
    [CEReactions] setter undefined (DOMString name, DOMString value);
    [CEReactions] deleter undefined (DOMString name);

    [CEReactions] Promise<void> promiseOperation();
    [CEReactions] readonly attribute Promise<void> promiseAttribute;
};
