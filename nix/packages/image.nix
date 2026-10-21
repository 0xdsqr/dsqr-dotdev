{
  dockerTools,
  app,
  appName,
  nodejs-slim_24,
  cacert,
}:
dockerTools.buildLayeredImage {
  name = appName;
  created = "1970-01-01T00:00:01Z";
  contents = [ cacert ];
  config = {
    User = "10001:10001";
    WorkingDir = "${app}/share/${appName}";
    Entrypoint = [
      "${nodejs-slim_24}/bin/node"
      "${app}/share/${appName}/server/index.mjs"
    ];
    Env = [
      "NODE_ENV=production"
      "HOST=0.0.0.0"
      "PORT=3000"
      "SSL_CERT_FILE=${cacert}/etc/ssl/certs/ca-bundle.crt"
      "NODE_EXTRA_CA_CERTS=${cacert}/etc/ssl/certs/ca-bundle.crt"
    ];
    ExposedPorts."3000/tcp" = { };
    Labels = {
      "org.opencontainers.image.source" = "https://github.com/0xdsqr/dsqr-dotdev";
      "org.opencontainers.image.title" = appName;
    };
  };
}
