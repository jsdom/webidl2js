[Exposed=Window]
interface BufferSourceTypes {
  void bs(BufferSource source);
  void ab(ArrayBuffer ab);
  void abv(ArrayBufferView abv);
  void u8a(Uint8Array u8);

  void abUnion((ArrayBuffer or DOMString) ab);
  void u8aUnion((Uint8Array or DOMString) ab);
};
