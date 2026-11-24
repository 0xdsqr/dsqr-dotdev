import { type Schema, SchemaIssue } from 'effect'

const formatter = SchemaIssue.makeFormatterStandardSchemaV1()

export const firstIssueMessage = (error: Schema.SchemaError) => formatter(error.issue).issues[0]?.message
