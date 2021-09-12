[Exposed=Window]
interface PromiseTypes {
  undefined voidPromiseConsumer(Promise<void> p);
  undefined promiseConsumer(Promise<double> p);

  Promise<void> promiseOperation();
  readonly attribute Promise<void> promiseAttribute;

  [LegacyUnforgeable] Promise<void> unforgeablePromiseOperation();
  [LegacyUnforgeable] readonly attribute Promise<void> unforgeablePromiseAttribute;

  static Promise<void> staticPromiseOperation();
  static readonly attribute Promise<void> staticPromiseAttribute;
};
