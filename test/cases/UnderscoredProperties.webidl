// https://heycam.github.io/webidl/#idl-names
interface _UnderscoredProperties {
  const byte _const = 42;
  attribute byte _attribute;
  static void _static(DOMString _void);
  void _operation(sequence<DOMString> _sequence);
};
