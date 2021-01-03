[Exposed=Window]
interface NoUselessIfElse {
  // # Overloads:
  undefined overloadsObjectOrBoolean(object arg1);
  undefined overloadsObjectOrBoolean(boolean arg1);

  undefined overloadsObjectOrBooleanOrNumeric(object arg1);
  undefined overloadsObjectOrBooleanOrNumeric(boolean arg1);
  undefined overloadsObjectOrBooleanOrNumeric(long arg1);

  undefined overloadsObjectOrNumeric(object arg1);
  undefined overloadsObjectOrNumeric(long arg1);

  undefined overloadsBooleanOrNumeric(boolean arg1);
  undefined overloadsBooleanOrNumeric(long arg1);

  // ## Avoid regressions:
  undefined overloadsObjectOrBooleanOrString(object arg1);
  undefined overloadsObjectOrBooleanOrString(boolean arg1);
  undefined overloadsObjectOrBooleanOrString(DOMString arg1);

  undefined overloadsObjectOrBooleanOrNumericOrString(object arg1);
  undefined overloadsObjectOrBooleanOrNumericOrString(boolean arg1);
  undefined overloadsObjectOrBooleanOrNumericOrString(long arg1);
  undefined overloadsObjectOrBooleanOrNumericOrString(DOMString arg1);

  undefined overloadsObjectOrNumericOrString(object arg1);
  undefined overloadsObjectOrNumericOrString(long arg1);
  undefined overloadsObjectOrNumericOrString(DOMString arg1);

  undefined overloadsBooleanOrNumericOrString(boolean arg1);
  undefined overloadsBooleanOrNumericOrString(long arg1);
  undefined overloadsBooleanOrNumericOrString(DOMString arg1);

  // # Unions:
  // undefined unionObjectOrBoolean((object or boolean) arg1);
  // undefined unionObjectOrBooleanOrNumeric((object or boolean or long) arg1);
  // undefined unionObjectOrNumeric((object or long) arg1);
  undefined unionBooleanOrNumeric((boolean or long) arg1);

  // ## Avoid regressions:
  // undefined unionObjectOrBooleanOrString((object or boolean or DOMString) arg1);
  // undefined unionObjectOrBooleanOrNumericOrString((object or boolean or long or DOMString) arg1);
  // undefined unionObjectOrNumericOrString((object or long or DOMString) arg1);
  undefined unionBooleanOrNumericOrString((boolean or long or DOMString) arg1);
};
