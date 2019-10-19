// Adapted from NodeList
// https://dom.spec.whatwg.org/#nodelist
[Exposed=Window]
interface URLList {
  getter URL? item(unsigned long index);
  readonly attribute unsigned long length;
  iterable<URL>;
};
