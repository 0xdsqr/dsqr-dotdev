import { HttpApiEndpoint, HttpApiGroup } from 'effect/unstable/httpapi'
import { HealthResponse } from '../domain/health'

export class HealthApi extends HttpApiGroup.make('health', { topLevel: true }).add(
  HttpApiEndpoint.get('health', '/api/health', { success: HealthResponse }),
) {}
