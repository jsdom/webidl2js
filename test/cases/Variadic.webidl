[Exposed=Window]
interface Variadic {
  undefined simple1(DOMString... strings);

  undefined simple2(DOMString first, URL... urls);

  // This is handled in a broken way, with no conversions. It is included here just so we can track any behavior changes
  // to the broken implementation over time.
  undefined overloaded1(DOMString... strings);
  undefined overloaded1(unsigned long... numbers);

  // This is handled in an extra-broken way, with a random conversion of the second argument to a DOMString, but no
  // subsequent arguments. Again, it is included here just so we can track changes over time.
  undefined overloaded2(DOMString first, DOMString... strings);
  undefined overloaded2(unsigned long first, DOMString... strings);
};
