[Exposed=Window]
interface TypedefsAndUnions {
  undefined numOrStrConsumer(NumOrStr a);
  undefined numOrEnumConsumer((double or RequestDestination)? a);
  undefined numOrStrOrNullConsumer(NumOrStrOrNull a);
  undefined numOrStrOrURLOrNullConsumer(NumOrStrOrURLOrNull? a);
  undefined numOrObjConsumer((double or object) a);
  undefined urlMapInnerConsumer(URLMapInner a);
  undefined urlMapConsumer(URLMap a);
  undefined bufferSourceOrURLConsumer((BufferSource or URL) b);
  undefined arrayBufferViewOrURLMapConsumer((ArrayBufferView or URLMap) b);
  undefined arrayBufferViewDupConsumer((ArrayBufferView or Uint8ClampedArray) b);
  undefined arrayBufferOrSharedArrayBufferConsumer((ArrayBuffer or SharedArrayBuffer) b);
  undefined callbackFunctionOrNumConsumer((AsyncCallbackFunction or double) cb);
  undefined callbackInterfaceOrNumConsumer((AsyncCallbackInterface or double) cb);

  attribute (ArrayBuffer or Uint8Array or Uint16Array) buf;
  attribute DOMTimeStamp time;
};

typedef ([Clamp] double or DOMString) NumOrStr;
typedef [EnforceRange] NumOrStr? NumOrStrOrNull;
typedef (NumOrStrOrNull or URL)? NumOrStrOrURLOrNull;
typedef record<USVString, URL> URLMapInner;
typedef URLMapInner? URLMap;
