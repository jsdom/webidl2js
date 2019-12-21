[Exposed=Window]
interface AnyType {
  any getAny();
  void setAny(any param);

  object getObject();
  void setObject(object obj);

  attribute any attrAny;
  attribute object attrObject;
};
