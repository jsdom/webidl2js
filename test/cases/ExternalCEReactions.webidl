[Exposed=Window]
partial interface ExternalCEReactions {
  [CEReactions, WebIDL2JSCallWithGlobal] static any method();
  [CEReactions] static attribute long value;
};
