import { FetchHttpClient } from 'effect/unstable/http'
import * as AtomHttpApi from 'effect/unstable/reactivity/AtomHttpApi'
import { AppApi, DotdevApi } from './api/api'

const baseUrl = (globalThis as { location?: { origin: string } }).location?.origin

export class DotdevClient extends AtomHttpApi.Service<DotdevClient>()('@dsqr-dotdev/api/DotdevClient', {
  api: DotdevApi,
  httpClient: FetchHttpClient.layer,
  baseUrl,
}) {}

export class AppClient extends AtomHttpApi.Service<AppClient>()('@dsqr-dotdev/api/AppClient', {
  api: AppApi,
  httpClient: FetchHttpClient.layer,
  baseUrl,
}) {}
