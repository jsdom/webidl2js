[Exposed=Window]
interface AsyncIterableWithReturn {
  [WebIDL2JSHasReturnSteps] async iterable<DOMString>(optional Dictionary dict = {});
};
