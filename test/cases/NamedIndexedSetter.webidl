[Exposed=Window]
interface NamedIndexedSetter {
  [WebIDL2JSValueAsUnsupported=_null] getter URL? item(unsigned long index);
  setter undefined setItem(unsigned long index, URL value);
};
