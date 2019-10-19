[Exposed=Window]
interface Unforgeable {
  [Unforgeable] stringifier attribute USVString href;
  [Unforgeable] readonly attribute USVString origin;
  [Unforgeable] attribute USVString protocol;
  [Unforgeable] void assign(USVString url);
};
