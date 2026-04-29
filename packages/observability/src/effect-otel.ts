import * as OtlpSerialization from "@effect/opentelemetry/OtlpSerialization"
import * as OtlpTracer from "@effect/opentelemetry/OtlpTracer"
import * as FetchHttpClient from "@effect/platform/FetchHttpClient"
import * as Duration from "effect/Duration"
import * as Layer from "effect/Layer"

export type ServiceName = string

export type OtelLayerConfig = {
  serviceName: ServiceName
  endpoint?: string | null
  environment?: string | null
  resourceAttributes?: string | null
  serviceVersion?: string | null
  exportInterval?: Duration.DurationInput
  shutdownTimeout?: Duration.DurationInput
}

const parseResourceAttributes = (attributes: string | null | undefined) => {
  if (!attributes) {
    return {}
  }

  return Object.fromEntries(
    attributes
      .split(",")
      .map((pair) => {
        const [rawKey, ...rawValue] = pair.split("=")
        const key = rawKey?.trim()
        const value = rawValue.join("=").trim()
        return key && value ? [key, value] : null
      })
      .filter((pair): pair is [string, string] => pair !== null),
  )
}

export const normalizeOtlpTraceEndpoint = (endpoint: string | null | undefined) => {
  const trimmed = endpoint?.trim()
  if (!trimmed) {
    return null
  }

  if (trimmed.endsWith("/v1/traces")) {
    return trimmed
  }

  return `${trimmed.replace(/\/+$/, "")}/v1/traces`
}

export const createOtelLayer = (config: OtelLayerConfig): Layer.Layer<never> => {
  const url = normalizeOtlpTraceEndpoint(config.endpoint)

  if (!url) {
    return Layer.empty
  }

  const attributes = parseResourceAttributes(config.resourceAttributes)
  const environment = config.environment?.trim()

  if (environment && attributes["deployment.environment"] == null) {
    attributes["deployment.environment"] = environment
  }

  return OtlpTracer.layer({
    url,
    resource: {
      serviceName: config.serviceName,
      serviceVersion: config.serviceVersion ?? undefined,
      attributes,
    },
    exportInterval: config.exportInterval ?? Duration.seconds(5),
    maxBatchSize: 1000,
    shutdownTimeout: config.shutdownTimeout ?? Duration.seconds(5),
  }).pipe(Layer.provide(Layer.mergeAll(FetchHttpClient.layer, OtlpSerialization.layerJson)))
}

export const createOtelLayerFromEnv = (defaultServiceName: ServiceName) =>
  createOtelLayer({
    serviceName: process.env.OTEL_SERVICE_NAME?.trim() || defaultServiceName,
    endpoint:
      process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    environment: process.env.ENVIRONMENT ?? process.env.NODE_ENV,
    resourceAttributes: process.env.OTEL_RESOURCE_ATTRIBUTES,
    serviceVersion: process.env.SERVICE_VERSION ?? process.env.SENTRY_RELEASE,
  })
