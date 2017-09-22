[NoInterfaceObject]
interface Mixin : MixinInherited {
              DOMString mixinOp();
  attribute   DOMString mixinAttr;
  const       byte      mixinConst = 42;
};
Mixin implements MixinMixin;
