import { Schema, SchemaTransformation } from 'effect'

const EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/

export const EmailAddress = Schema.String.pipe(
  Schema.decode(SchemaTransformation.trim()),
  Schema.decode(SchemaTransformation.toLowerCase()),
  Schema.check(
    Schema.isMaxLength(254, { message: 'That email is too long.' }),
    Schema.isPattern(EMAIL, { message: 'Enter an email like name@example.com.' }),
  ),
)
