[Exposed=Window]
interface SeqAndRec {
  constructor();

  undefined recordConsumer(record<USVString, double> rec);
  undefined recordConsumer2(record<USVString, URL> rec);
  undefined sequenceConsumer(sequence<USVString> seq);
  undefined sequenceConsumer2(sequence<UnknownInterface> seq);
  undefined frozenArrayConsumer(FrozenArray<double> arr);
};
