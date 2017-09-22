interface MixedIn {
  attribute DOMString mixedInAttr;
            DOMString mixedInOp();
  const     byte      mixedInConst = 43;
};
MixedIn implements Mixin;
