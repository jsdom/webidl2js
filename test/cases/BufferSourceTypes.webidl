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
  undefined asabv([AllowShared] ArrayBufferView abv);
  undefined asu8a([AllowShared] Uint8Array u8);

  undefined arbs([AllowResizable] BufferSource source);
  undefined arab([AllowResizable] ArrayBuffer ab);
  undefined arsab([AllowResizable] SharedArrayBuffer sab);
  undefined arabv([AllowResizable] ArrayBufferView abv);
  undefined aru8a([AllowResizable] Uint8Array u8);
};
