import { type SchemaError, SchemaIssue } from 'effect'

const formatter = SchemaIssue.makeFormatterStandardSchemaV1()

export const firstIssueMessage = (error: SchemaError.SchemaError) => formatter(error.issue).issues[0]?.message
