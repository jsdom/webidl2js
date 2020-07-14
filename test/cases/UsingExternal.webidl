[Exposed=Window]
interface UsingExternal {
  void methodImportedDOMException(Imported-DOMException domException);
  void methodImportedURL(Imported-URL url);
  void methodImportedURLSearchParams(Imported-URLSearchParams url);

  attribute Imported-DOMException propertyImportedDOMException;
  attribute Imported-URL propertyImportedURL;
  attribute Imported-URLSearchParams propertyImportedURLSearchParams;
};
