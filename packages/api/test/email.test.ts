import { assert, describe, it } from '@effect/vitest'
import { Result, Schema } from 'effect'
import { firstIssueMessage, SubscribeRequest } from '../src/index'

const decode = Schema.decodeUnknownResult(SubscribeRequest)

describe('SubscribeRequest', () => {
  it('trims and lowercases the address', () => {
    const result = decode({ email: '  Me@DSQR.dev ' })
    assert.isTrue(Result.isSuccess(result))
    if (Result.isSuccess(result)) assert.strictEqual(result.success.email, 'me@dsqr.dev')
  })

  it.each(['me', 'me@', 'me@dsqr', 'a b@dsqr.dev', `${'a'.repeat(250)}@x.io`])('rejects %s with a readable message', (email) => {
    const result = decode({ email })
    assert.isTrue(Result.isFailure(result))
    if (Result.isFailure(result)) assert.isString(firstIssueMessage(result.failure))
  })
})
