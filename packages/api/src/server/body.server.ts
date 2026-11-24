import { Schema } from 'effect'

export const MAX_BODY_BYTES = 4096

export class BodyTooLargeError extends Schema.TaggedError<BodyTooLargeError>()(
  'BodyTooLargeError',
  { maxBytes: Schema.Number },
  { httpApiStatus: 413 },
) {
  override get message() {
    return 'Request is too large.'
  }
}

/** Reads a request body as bytes, refusing more than `maxBytes` before buffering it. */
export async function readBody(request: Request, maxBytes = MAX_BODY_BYTES) {
  if (Number(request.headers.get('content-length') ?? 0) > maxBytes) throw new BodyTooLargeError({ maxBytes })
  if (!request.body) return new Uint8Array()

  const reader = request.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    total += value.byteLength
    if (total > maxBytes) {
      await reader.cancel()
      throw new BodyTooLargeError({ maxBytes })
    }
    chunks.push(value)
  }

  const body = new Uint8Array(total)
  let offset = 0
  for (const chunk of chunks) {
    body.set(chunk, offset)
    offset += chunk.byteLength
  }
  return body
}
