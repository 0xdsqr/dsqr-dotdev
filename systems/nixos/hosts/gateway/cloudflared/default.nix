{
  config,
  pkgs,
  lib,
  ...
}:
let
  tunnelId = "af7ebddc-a096-441c-afe1-ab19bab3d8ab";
  usePulumiManagedTunnelToken = builtins.pathExists ./token.age;
in
{
  environment.systemPackages = with pkgs; [ cloudflared ];

  users.users.cloudflared = {
    group = "cloudflared";
    isSystemUser = true;
    home = "/var/lib/cloudflared";
    createHome = true;
  };
  users.groups.cloudflared = { };

  age.secrets =
    lib.optionalAttrs (!usePulumiManagedTunnelToken) {
      cloudflaredCredentials = {
        file = ./credentials.json.age;
        path = "/etc/cloudflared/credentials.json";
        owner = "cloudflared";
        group = "cloudflared";
        mode = "0400";
      };
    }
    // lib.optionalAttrs usePulumiManagedTunnelToken {
      cloudflaredTunnelToken = {
        file = ./token.age;
        path = "/run/agenix/cloudflaredTunnelToken";
        owner = "cloudflared";
        group = "cloudflared";
        mode = "0400";
      };
    };

  services.cloudflared = lib.mkIf (!usePulumiManagedTunnelToken) {
    enable = true;
    tunnels = {
      "${tunnelId}" = {
        credentialsFile = config.age.secrets.cloudflaredCredentials.path;
        default = "http_status:404";
        ingress = {
          "dsqr.dev" = {
            service = "http://10.10.30.200";
            originRequest = {
              httpHostHeader = "dsqr.dev";
            };
          };

          "studio.dsqr.dev" = {
            service = "http://10.10.30.200";
            originRequest = {
              httpHostHeader = "studio.dsqr.dev";
            };
          };

          "s3.dsqr.dev" = {
            service = "http://10.10.30.107:9000";
          };
          "cdn.dsqr.dev" = {
            service = "http://10.10.30.107:9000";
          };

          "tastingswithtay.com" = {
            service = "http://10.10.30.200";
            originRequest = {
              httpHostHeader = "tastingswithtay.com";
            };
          };

          "admin.tastingswithtay.com" = {
            service = "http://10.10.30.200";
            originRequest = {
              httpHostHeader = "admin.tastingswithtay.com";
            };
          };
        };
      };
    };
  };

  systemd.services.cloudflared-managed-tunnel = lib.mkIf usePulumiManagedTunnelToken {
    description = "Cloudflare managed tunnel (${tunnelId})";
    after = [
      "network.target"
      "network-online.target"
    ];
    wants = [
      "network.target"
      "network-online.target"
    ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      User = "cloudflared";
      Group = "cloudflared";
      Restart = "on-failure";
      RestartSec = "5s";
      WorkingDirectory = "/var/lib/cloudflared";
      StateDirectory = "cloudflared";
      ExecStart = "${pkgs.bash}/bin/bash -ec 'exec ${pkgs.cloudflared}/bin/cloudflared tunnel run --token \"$(cat ${config.age.secrets.cloudflaredTunnelToken.path})\"'";
    };
  };
}
