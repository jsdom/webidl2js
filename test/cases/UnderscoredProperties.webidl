// https://heycam.github.io/webidl/#idl-names
[Exposed=Window]
interface _UnderscoredProperties {
  const byte _const = 42;
  attribute byte _attribute;
  static undefined _static(DOMString _void);
  undefined _operation(sequence<DOMString> _sequence);
};
