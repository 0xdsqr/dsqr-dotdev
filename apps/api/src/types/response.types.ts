import { t } from "elysia"

export const ResponseSchema = t.Object({
  data: t.Optional(t.Any()),
  meta: t.Optional(t.Object({})),
  errors: t.Optional(
    t.Array(
      t.Object({
        status: t.String(),
        title: t.String(),
        detail: t.Optional(t.String()),
      }),
    ),
  ),
})

export const HealthStatusSchema = t.Object({
  status: t.String(),
  version: t.String(),
  services: t.Object({
    database: t.Object({
      status: t.String(),
      latency_ms: t.Number(),
    }),
    api: t.Object({
      status: t.String(),
      uptime_sec: t.Number(),
    }),
  }),
  timestamp: t.String(),
})

export interface ApiResponse {
  data?: any;
  meta?: Record<string, any>;
  errors?: Array<{
    status: string;
    title: string;
    detail?: string;
  }>;
}

export interface HealthStatus {
  status: "up" | "down" | "degraded";
  version: string;
  services: {
    database: {
      status: "up" | "down";
      latency_ms: number;
    };
    api: {
      status: "up" | "down";
      uptime_sec: number;
    };
  };
  timestamp: string;
}

export interface ControllerResponse {
  status: number;
  body: ApiResponse;
}