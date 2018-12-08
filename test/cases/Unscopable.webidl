interface Unscopable {
  [Unscopable] attribute boolean unscopableTest;
};
Unscopable includes UnscopableMixin;

interface mixin UnscopableMixin {
  [Unscopable] attribute boolean unscopableMixin;
};
