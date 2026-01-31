# NixOS module for dsqr-dotdev services
#
# Declares systemd services for dotdev (port 3000) and studio (port 3001).
# Both are TanStack Start SSR apps running via Node.js.
#
# Usage in your NixOS configuration:
#
#   imports = [ dsqr-dotdev.nixosModules.default ];
#
#   services.dsqr-dotdev.dotdev = {
#     enable = true;
#     environmentFile = "/run/secrets/dotdev.env";
#   };
#
#   services.dsqr-dotdev.studio = {
#     enable = true;
#     environmentFile = "/run/secrets/studio.env";
#   };
#
{ self }:
{
  config,
  lib,
  pkgs,
  ...
}:
let
  cfg = config.services.dsqr-dotdev;

  packages = import ./packages.nix {
    inherit pkgs self;
    bun2nix = import ./bun2nix { inherit pkgs; };
  };

  # Shared systemd service options for both apps
  appOptions =
    { name, defaultPort }:
    {
      enable = lib.mkEnableOption "dsqr-dotdev ${name} service";

      package = lib.mkOption {
        type = lib.types.package;
        default = packages.${name};
        defaultText = lib.literalExpression "self.packages.\${system}.${name}";
        description = "The ${name} package to run.";
      };

      port = lib.mkOption {
        type = lib.types.port;
        default = defaultPort;
        description = "Port for the ${name} server to listen on.";
      };

      environmentFile = lib.mkOption {
        type = lib.types.nullOr lib.types.path;
        default = null;
        description = ''
          Path to an environment file containing secrets (DATABASE_URL,
          AUTH_SECRET, etc.). This file should NOT be in the Nix store.
          Use sops-nix, agenix, or a manually placed file in /run/secrets/.
        '';
      };

      extraEnvironment = lib.mkOption {
        type = lib.types.attrsOf lib.types.str;
        default = { };
        description = "Extra environment variables to set for the service.";
      };

      user = lib.mkOption {
        type = lib.types.str;
        default = "dsqr-dotdev";
        description = "User to run the service as.";
      };

      group = lib.mkOption {
        type = lib.types.str;
        default = "dsqr-dotdev";
        description = "Group to run the service as.";
      };
    };

  # Generate a systemd service for an app
  mkService =
    name: appCfg:
    lib.mkIf appCfg.enable {
      description = "dsqr-dotdev ${name}";
      after = [ "network.target" ];
      wantedBy = [ "multi-user.target" ];

      environment = {
        NODE_ENV = "production";
        PORT = toString appCfg.port;
      }
      // appCfg.extraEnvironment;

      serviceConfig = {
        Type = "simple";
        ExecStart = "${appCfg.package}/bin/${name}";
        Restart = "always";
        RestartSec = 5;

        # Run as dedicated user
        User = appCfg.user;
        Group = appCfg.group;

        # Load secrets from file (DATABASE_URL, AUTH_SECRET, etc.)
        EnvironmentFile = lib.mkIf (appCfg.environmentFile != null) appCfg.environmentFile;

        # Working directory for the app
        WorkingDirectory = "${appCfg.package}";

        # Hardening
        NoNewPrivileges = true;
        ProtectSystem = "strict";
        ProtectHome = true;
        PrivateTmp = true;
        PrivateDevices = true;
        ProtectKernelTunables = true;
        ProtectKernelModules = true;
        ProtectControlGroups = true;
        RestrictSUIDSGID = true;
        RestrictNamespaces = true;
        LockPersonality = true;
        RestrictRealtime = true;
        SystemCallArchitectures = "native";
        MemoryDenyWriteExecute = false; # Node.js JIT needs this
      };
    };
in
{
  options.services.dsqr-dotdev = {
    dotdev = appOptions {
      name = "dotdev";
      defaultPort = 3000;
    };
    studio = appOptions {
      name = "studio";
      defaultPort = 3001;
    };
  };

  config = lib.mkMerge [
    (lib.mkIf (cfg.dotdev.enable || cfg.studio.enable) {
      users.users.dsqr-dotdev = {
        isSystemUser = true;
        group = "dsqr-dotdev";
        description = "dsqr-dotdev service user";
      };
      users.groups.dsqr-dotdev = { };
    })

    {
      systemd.services = lib.filterAttrs (_: v: v != { }) {
        dotdev = mkService "dotdev" cfg.dotdev;
        studio = mkService "studio" cfg.studio;
      };
    }
  ];
}
