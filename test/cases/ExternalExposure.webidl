[Exposed=Window]
partial interface ExternalExposure {
  static undefined windowOnly();
};

[Exposed=Worker]
partial interface ExternalExposure {
  static undefined workerOnly();
};

[Exposed=(Window,Worker)]
partial interface ExternalExposure {
  static undefined shared();
};
