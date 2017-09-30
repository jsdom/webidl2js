interface TypedefsAndUnions {
  void numOrStrConsumer(NumOrStr a);
  void numOrEnumConsumer((double or RequestDestination)? a);
  void numOrStrOrNullConsumer(NumOrStrOrNull a);
  void numOrStrOrURLOrNullConsumer(NumOrStrOrURLOrNull? a);
  void urlMapInnerConsumer(URLMapInner a);
  void urlMapConsumer(URLMap a);
  void bufferSourceOrURLConsumer((BufferSource or URL) b);
  void arrayBufferViewOrURLMapConsumer((ArrayBufferView or URLMap) b);
  void arrayBufferViewDupConsumer((ArrayBufferView or Uint8ClampedArray) b);

  attribute (ArrayBuffer or Uint8Array or Uint16Array) buf;
  attribute DOMTimeStamp time;
};

typedef ([Clamp] double or DOMString) NumOrStr;
typedef [EnforceRange] NumOrStr? NumOrStrOrNull;
typedef (NumOrStrOrNull or URL)? NumOrStrOrURLOrNull;
typedef record<USVString, URL> URLMapInner;
typedef URLMapInner? URLMap;
