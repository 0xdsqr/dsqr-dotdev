import { HttpApi } from 'effect/unstable/httpapi'
import { HealthApi } from './health'
import { SubscriptionsApi } from './subscriptions'

export class AppApi extends HttpApi.make('app').add(HealthApi) {}

export class DotdevApi extends HttpApi.make('dotdev').add(HealthApi).add(SubscriptionsApi) {}
