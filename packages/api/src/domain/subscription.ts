import { Schema } from 'effect'
import { EmailAddress } from './email'

export const SubscribeRequest = Schema.Struct({ email: EmailAddress })
export type SubscribeRequest = typeof SubscribeRequest.Type

export const SubscribeResponse = Schema.Struct({ status: Schema.Literal('accepted') })

export class RateLimited extends Schema.TaggedError<RateLimited>()('RateLimited', {}, { httpApiStatus: 429 }) {}
