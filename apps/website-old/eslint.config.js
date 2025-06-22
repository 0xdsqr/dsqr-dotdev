import { defineFlatConfig } from '@workspace/eslint-config/helpers'

export default defineFlatConfig([
  {
    ignores: ['src/contentlayer/generated/**/*', 'src/lib/registry/**/*'],
  },
  ...require('@workspace/eslint-config/next'),
])