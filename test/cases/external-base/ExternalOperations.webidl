[Exposed=Window]
interface ExternalOperations {
  constructor();
  [WebIDL2JSCallWithGlobal] static ExternalOperations create();
  readonly attribute DOMString value;
};
