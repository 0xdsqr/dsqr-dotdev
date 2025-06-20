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

export interface ApiResponse {
  data?: any
  meta?: Record<string, any>
  errors?: Array<{
    status: string
    title: string
    detail?: string
  }>
}

export interface ControllerResponse {
  status: number
  body: ApiResponse
}
