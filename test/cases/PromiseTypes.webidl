[Exposed=Window]
interface PromiseTypes {
  void voidPromiseConsumer(Promise<void> p);
  void promiseConsumer(Promise<double> p);

  Promise<void> promiseOperation();
  readonly attribute Promise<void> promiseAttribute;

  [LegacyUnforgeable] Promise<void> unforgeablePromiseOperation();
  [LegacyUnforgeable] readonly attribute Promise<void> unforgeablePromiseAttribute;

  static Promise<void> staticPromiseOperation();
  static readonly attribute Promise<void> staticPromiseAttribute;
};
