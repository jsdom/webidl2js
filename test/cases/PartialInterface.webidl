partial interface PartialInterface {
  attribute DOMString value;
  undefined partialOperation(DOMString value);
};

[Exposed=Window]
interface PartialInterface {
  constructor();
  undefined operation(long value);
};

partial interface PartialInterface {
  const boolean ENABLED = true;
  const unrestricted double NOT_A_NUMBER = NaN;
  const unrestricted double POSITIVE_INFINITY = Infinity;
  const unrestricted double NEGATIVE_INFINITY = -Infinity;
};
