[Global=Window,
 Exposed=Window,
 LegacyUnenumerableNamedProperties]
interface Window {
  getter object (DOMString name);
  // Since this is the global object, the IDL named getter adds a NamedPropertiesObject exotic
  // object on the prototype chain. Indeed, this does not make the global object an exotic object.
  // Indexed access is taken care of by the WindowProxy exotic object.
};
