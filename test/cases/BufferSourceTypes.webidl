[Exposed=Window]
interface BufferSourceTypes {
  undefined bs(BufferSource source);
  undefined ab(ArrayBuffer ab);
  undefined abv(ArrayBufferView abv);
  undefined u8a(Uint8Array u8);

  undefined abUnion((ArrayBuffer or DOMString) ab);
  undefined u8aUnion((Uint8Array or DOMString) ab);
};
