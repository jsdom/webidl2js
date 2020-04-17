[Exposed=Window]
interface PromiseTypes {
  void voidPromiseConsumer(Promise<void> p);
  void promiseConsumer(Promise<double> p);

  Promise<void> promiseOperation();
  readonly attribute Promise<void> promiseAttribute;

  [Unforgeable] Promise<void> unforgeablePromiseOperation();
  [Unforgeable] readonly attribute Promise<void> unforgeablePromiseAttribute;

  static Promise<void> staticPromiseOperation();
  static readonly attribute Promise<void> staticPromiseAttribute;
};
