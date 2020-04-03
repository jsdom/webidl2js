// Simplified from https://drafts.fxtf.org/geometry-1/#domrect

[Exposed=(Window,Worker),
 Serializable,
 LegacyWindowAlias=SVGRect]
interface DOMRect /* : DOMRectReadOnly */ {
  constructor(optional unrestricted double x = 0, optional unrestricted double y = 0,
          optional unrestricted double width = 0, optional unrestricted double height = 0);

  [NewObject] static DOMRect fromRect(optional DOMRectInit other);

  inherit attribute unrestricted double x;
  inherit attribute unrestricted double y;
  inherit attribute unrestricted double width;
  inherit attribute unrestricted double height;
};
