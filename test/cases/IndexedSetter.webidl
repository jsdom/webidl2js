[Exposed=Window]
interface IndexedSetter {
  getter octet (unsigned long index);
  [CEReactions] setter undefined (unsigned long index, [Clamp] octet value);
};
