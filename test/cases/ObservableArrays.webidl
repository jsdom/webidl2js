typedef DOMString ObservableArrayName;
typedef ObservableArray<ObservableArrayName> ObservableArrayNames;

interface mixin ObservableArrayMixin {
  attribute ObservableArray<long> numbers;
};

[Exposed=Window]
interface ObservableArrays {
  constructor();
  attribute ObservableArrayNames names;
  readonly attribute ObservableArray<DOMString> readonlyNames;
  attribute ObservableArray<ObservableArrays?> employees;
  attribute ObservableArray<VoidFunction> callbacks;
  attribute ObservableArray<FrozenArray<DOMString>> groups;
};

ObservableArrays includes ObservableArrayMixin;
