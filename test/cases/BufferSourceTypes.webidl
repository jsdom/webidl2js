[Exposed=Window]
interface BufferSourceTypes {
  undefined bs(BufferSource source);
  undefined ab(ArrayBuffer ab);
  undefined sab(SharedArrayBuffer sab);
  undefined abv(ArrayBufferView abv);
  undefined u8a(Uint8Array u8);

  undefined abUnion((ArrayBuffer or DOMString) ab);
  undefined sabUnion((SharedArrayBuffer or DOMString) ab);
  undefined u8aUnion((Uint8Array or DOMString) ab);

  undefined asbs(AllowSharedBufferSource source);
  undefined abvAllowShared([AllowShared] ArrayBufferView abv);
  undefined u8aAllowShared([AllowShared] Uint8Array u8);

  undefined bsAllowResizable([AllowResizable] BufferSource source);
  undefined abAllowResizable([AllowResizable] ArrayBuffer ab);
  undefined sabAllowResizable([AllowResizable] SharedArrayBuffer sab);
  undefined abvAllowResizable([AllowResizable] ArrayBufferView abv);
  undefined u8aAllowResizable([AllowResizable] Uint8Array u8);

  undefined asbsAllowResizable([AllowResizable] AllowSharedBufferSource source);
  undefined abvAllowResizableShared([AllowResizable, AllowShared] ArrayBufferView abv);
  undefined u8aAllowResizableShared([AllowResizable, AllowShared] Uint8Array u8);
};
