[Exposed=Window]
interface Unscopable {
  [Unscopable] attribute boolean unscopableTest;
  [Unscopable] undefined unscopableOperation();
};
Unscopable includes UnscopableMixin;

interface mixin UnscopableMixin {
  [Unscopable] attribute boolean unscopableMixin;
};
