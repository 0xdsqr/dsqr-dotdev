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
    {
      zone: "dsqrDev",
      name: "rsa._domainkey.dsqr.dev",
      type: "TXT",
      content:
        "v=DKIM1; k=rsa; p=MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuDCKIcqtrCFKCQWZ0Lv66vu0b3Sj9Unkmvic2l6rL41Y7VEBhfifOJ00T16K5Dzhbv8rkDrSkqj21gW4BcOe/gIahy4XwKwSsLPolYt2ElS4UqOkjxswwRKIeLtP5QP+yN1oXtEWMoUtHDzjOeILqwl8Sq/9n6n1S+fgeyumWMIm+qKqku84CuzxPpYdxXMipNa5q6cijfx+11sqDwep4rx1nTvUTawM4x/eYMj5zgMfRvFhhIPacr5QMq1RQYs5rv9tYrj44Q6eslXeDIA7Q01TXOeUZtTuM17cObIkU0Pm9uneMhCTXGUVxhk9eiZvsgZpy2rLaEjWNThKogoDxwIDAQAB",
      ttl: 1,
    },
    {
      zone: "dsqrDev",
      name: "ed25519._domainkey.dsqr.dev",
      type: "TXT",
      content: "v=DKIM1; k=ed25519; p=vLn6/q7xPftjFkPXw9m31vE6tEt+pyoJVmAmp0Q/JEs=",
      ttl: 1,
    },
  ],
  r2Buckets: [],
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
      hostname: "fidara.dsqr.dev",
      zone: "dsqrDev",
      service: "https://10.10.30.200",
      originRequest: {
        http2Origin: false,
        httpHostHeader: "fidara.dsqr.dev",
        noTlsVerify: true,
      },
    },
    {
      hostname: "api.fidara.dsqr.dev",
      zone: "dsqrDev",
      service: "https://10.10.30.200",
      originRequest: {
        http2Origin: false,
        httpHostHeader: "api.fidara.dsqr.dev",
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
