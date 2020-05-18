[Exposed=Window]
interface AsyncIterablePairArgs {
  async iterable<URL, DOMString>(optional boolean url = false, optional DOMString string, optional Dictionary dict = {});
};
