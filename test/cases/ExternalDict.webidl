dictionary ExternalDict {
  ReadableStream stream;
  sequence<ReadableStream> seq;
  record<USVString, ReadableStream> rec;
};
