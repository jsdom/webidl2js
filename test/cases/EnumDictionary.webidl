dictionary EnumDictionary {
  RequestDestination destination;
  EscapedEnum escaped;
  RequestDestination? nullableDestination;
  (RequestDestination or long) unionDestination;
  sequence<RequestDestination> destinations;
  record<DOMString, RequestDestination> destinationsByName;
};
