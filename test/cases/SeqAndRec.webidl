[Exposed=Window]
interface SeqAndRec {
  constructor();

  undefined recordConsumer(record<USVString, double> rec);
  undefined recordConsumer2(record<USVString, URL> rec);
  undefined sequenceConsumer(sequence<USVString> seq);
  undefined sequenceConsumer2(sequence<UnknownInterface> seq);
  undefined asyncSequenceConsumer(async_sequence<USVString> async_seq);
  undefined asyncSequenceConsumer2(async_sequence<UnknownInterface> async_seq);
  undefined frozenArrayConsumer(FrozenArray<double> arr);

  async_sequence<double> asyncSequencePassthrough(async_sequence<double> async_seq);
};
