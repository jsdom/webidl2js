[Exposed=Window]
interface BrandCheckAsyncIterable {
  [WebIDL2JSHasReturnSteps] async iterable<DOMString, BrandCheck>(optional unsigned long offset = 0);
};
