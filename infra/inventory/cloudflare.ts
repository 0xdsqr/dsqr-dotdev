export const cloudflare = {
  tunnel: {
    name: "gateway",
    defaultService: "http_status:404",
  },
  zones: {
    dsqrDev: "dsqr.dev",
    tastingswithtayCom: "tastingswithtay.com",
  },
  mailHostname: "mx.dsqr.dev",
  dnsRecords: [
    {
      zone: "dsqrDev",
      name: "dsqr.dev",
      type: "MX",
      content: "mx.dsqr.dev",
      priority: 10,
      ttl: 1,
    },
    {
      zone: "dsqrDev",
      name: "dsqr.dev",
      type: "TXT",
      content: "v=spf1 mx -all",
      ttl: 1,
    },
    {
      zone: "dsqrDev",
      name: "_dmarc.dsqr.dev",
      type: "TXT",
      content: "v=DMARC1; p=quarantine; rua=mailto:postmaster@dsqr.dev; adkim=s; aspf=s",
      ttl: 1,
    },
  ],
  r2Buckets: [
    {
      name: "dsqr-homelab-backups",
      location: "wnam",
      storageClass: "Standard",
    },
  ],
  ingressRules: [
    {
      hostname: "dsqr.dev",
      zone: "dsqrDev",
      service: "https://10.10.30.200",
      originRequest: {
        http2Origin: false,
        httpHostHeader: "dsqr.dev",
        noTlsVerify: true,
      },
    },
    {
      hostname: "studio.dsqr.dev",
      zone: "dsqrDev",
      service: "https://10.10.30.200",
      originRequest: {
        http2Origin: false,
        httpHostHeader: "studio.dsqr.dev",
        noTlsVerify: true,
      },
    },
    {
      hostname: "labs.dsqr.dev",
      zone: "dsqrDev",
      service: "https://10.10.30.200",
      originRequest: {
        http2Origin: false,
        httpHostHeader: "labs.dsqr.dev",
        noTlsVerify: true,
      },
    },
    {
      hostname: "argocd.dsqr.dev",
      zone: "dsqrDev",
      service: "https://10.10.30.200",
      originRequest: {
        http2Origin: false,
        httpHostHeader: "argocd.dsqr.dev",
        noTlsVerify: true,
      },
    },
    {
      hostname: "api-hoo.dsqr.dev",
      zone: "dsqrDev",
      service: "http://10.10.30.108:9321",
    },
    {
      hostname: "s3.dsqr.dev",
      zone: "dsqrDev",
      service: "http://10.10.30.107:9000",
    },
    {
      hostname: "cdn.dsqr.dev",
      zone: "dsqrDev",
      service: "http://10.10.30.107:9000",
    },
    {
      hostname: "tastingswithtay.com",
      zone: "tastingswithtayCom",
      service: "https://10.10.30.200",
      originRequest: {
        http2Origin: false,
        httpHostHeader: "tastingswithtay.com",
        noTlsVerify: true,
      },
    },
    {
      hostname: "admin.tastingswithtay.com",
      zone: "tastingswithtayCom",
      service: "https://10.10.30.200",
      originRequest: {
        http2Origin: false,
        httpHostHeader: "admin.tastingswithtay.com",
        noTlsVerify: true,
      },
    },
  ],
} as const
