interface MixedIn {
  attribute DOMString mixedInAttr;
            DOMString mixedInOp();
  const     byte      mixedInConst = 43;
};
MixedIn implements Mixin;
MixedIn includes InterfaceMixin;

partial interface mixin InterfaceMixin {
  const       byte      ifaceMixinConst = 42;
};

interface mixin InterfaceMixin {
              DOMString ifaceMixinOp();
  attribute   DOMString ifaceMixinAttr;
};
