import { HttpApi } from 'effect/http-api'
import { HealthApi } from './health'
import { SubscriptionsApi } from './subscriptions'

export class AppApi extends HttpApi.make('app').add(HealthApi) {}

export class DotdevApi extends HttpApi.make('dotdev').add(HealthApi).add(SubscriptionsApi) {}
