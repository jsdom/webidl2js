[Constructor,Exposed=Window]
interface SeqAndRec {
  void recordConsumer(record<USVString, double> rec);
  void recordConsumer2(record<USVString, URL> rec);
  void sequenceConsumer(sequence<USVString> seq);
  void sequenceConsumer2(sequence<UnknownInterface> seq);
  void frozenArrayConsumer(FrozenArray<double> arr);
};
