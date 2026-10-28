[Exposed=(Window,Worker)]
callback interface CallbackInterfaceTypes {
  const octet ACCEPT = 1;
  long accept((DOMString or long) primitive, (URL or DOMString) wrapped);
};
