typedef [Clamp] unsigned short ClampedUnsignedShort;
typedef [EnforceRange] unsigned long RangedUnsignedLong;

[Exposed=Window]
interface NumericConversions {
  constructor([Clamp] octet clamped, [EnforceRange] unsigned short ranged);

  [Clamp] attribute octet clamped;
  [EnforceRange] attribute unsigned short ranged;
  attribute ClampedUnsignedShort typedefClamped;
  attribute RangedUnsignedLong typedefRanged;

  undefined convert([Clamp] octet clamped, [EnforceRange] unsigned short ranged);
  undefined convertTypedefs(ClampedUnsignedShort clamped, RangedUnsignedLong ranged);
  undefined convertElements(sequence<[Clamp] octet> clamped, sequence<[EnforceRange] unsigned short> ranged);

  async iterable<DOMString>([Clamp] optional octet clamped = 0, [EnforceRange] optional unsigned short ranged = 0);
};
