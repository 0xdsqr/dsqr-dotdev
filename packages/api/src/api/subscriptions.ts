import { HttpApiEndpoint, HttpApiGroup } from 'effect/unstable/httpapi'
import { RateLimited, SubscribeRequest, SubscribeResponse } from '../domain/subscription'

export class SubscriptionsApi extends HttpApiGroup.make('subscriptions').add(
  HttpApiEndpoint.post('subscribe', '/api/subscriptions', {
    payload: SubscribeRequest,
    success: SubscribeResponse,
    error: RateLimited,
  }),
) {}
