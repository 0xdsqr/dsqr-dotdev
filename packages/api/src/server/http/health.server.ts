import { Effect } from 'effect'
import { HttpApiBuilder } from 'effect/unstable/httpapi'
import { AppApi, DotdevApi } from '../../api/api'

const health = () => Effect.succeed({ message: 'API connected.' })

export const AppHealthHandlers = HttpApiBuilder.group(AppApi, 'health', (handlers) => handlers.handle('health', health))

export const DotdevHealthHandlers = HttpApiBuilder.group(DotdevApi, 'health', (handlers) =>
  handlers.handle('health', health),
)
