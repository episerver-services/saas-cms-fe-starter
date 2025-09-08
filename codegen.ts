import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })
import type { CodegenConfig } from '@graphql-codegen/cli'

const config: CodegenConfig = {
  schema: `${process.env.OPTIMIZELY_API_URL}?auth=${process.env.OPTIMIZELY_SINGLE_KEY}`,
  documents: './lib/optimizely/queries/**/*.graphql',
  generates: {
    './lib/optimizely/sdk.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-generic-sdk',
      ],
      config: {
        fetcher: 'function',
        rawRequest: false,
        avoidOptionals: true,
        useTypeImports: true,
        dedupeOperationSuffix: true,
        exportFragmentSpreadSubTypes: true,
        enumsAsTypes: true,
        scalars: {
          DateTime: 'string',
          Url: 'string',
          GUID: 'string',
        },
      },
    },
  },
}

export default config
