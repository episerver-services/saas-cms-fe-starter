/**
 * Returns mock GraphQL data for a given query name and variable set.
 * Used when MOCK_OPTIMIZELY is enabled in development.
 *
 * Extend this switch case to support additional operations.
 *
 * @template T - Expected GraphQL response shape
 * @param query - Raw GraphQL query string
 * @param variables - Variables passed to the GraphQL query
 * @returns Mocked GraphQL response matching the requested operation
 *
 * @throws If no mock data is available for the given query
 */
export function getMockResponse<T>(query: string, variables: unknown): T {
  const operation = extractOperationName(query)
  console.info('[MOCK_OPTIMIZELY] Mocking query:', operation)

  // ✅ Mock for StartPage (non-VB mode)
  if (operation === 'GetPreviewStartPage') {
    const { version = 'mock-version' } = variables as { version?: string }

    return {
      StartPage: {
        item: {
          blocks: [
            {
              __typename: 'HeroBlock',
              title: `HeroBlock – Mock Title for version ${version}`,
              subtitle: 'Mock Subtitle',
              decorationColorsPrimary: '#000000',
              decorationColorsSecondary: '#FFFFFF',
              showDecoration: true,
            },
          ],
        },
      },
    } as T
  }

  // ✅ Mock for Component block by key (VB block preview)
  if (operation === 'GetComponentByKey') {
    const {
      key = 'mock-key',
      version = 'mock-version',
      locales = ['en'],
    } = variables as { key?: string; version?: string; locales?: string[] }

    return {
      _Component: {
        item: {
          __typename: 'HeroBlock',
          title: `HeroBlock – Mock Title from key ${key}`,
          subtitle: `Version: ${version}, Locale: ${locales?.[0] ?? 'en'}`,
          decorationColorsPrimary: '#123456',
          decorationColorsSecondary: '#654321',
          showDecoration: true,
        },
      },
    } as T
  }

  // ✅ Mock for full Experience layout (VisualBuilder mode)
  if (operation === 'VisualBuilder') {
    const {
      key = 'mock-experience-key',
      version = 'mock-version',
      locales = ['en'],
    } = variables as { key?: string; version?: string; locales?: string[] }

    return {
      Experience: {
        item: {
          __typename: 'Experience',
          composition: {
            displayName: 'Mock Experience Layout',
            nodes: [
              {
                displaySettings: { backgroundColor: '#F0F0F0' },
                key: 'hero-node-1',
                component: {
                  __typename: 'HeroBlock',
                  title: `VisualBuilder HeroBlock – Mock for ${key}`,
                  subtitle: `Version: ${version}, Locale: ${locales?.[0] ?? 'en'}`,
                  decorationColorsPrimary: '#FF0000',
                  decorationColorsSecondary: '#00FF00',
                  showDecoration: true,
                },
              },
            ],
          },
        },
      },
    } as T
  }

  // ❌ No match – fail gracefully
  throw new Error(`[MOCK_OPTIMIZELY] No mock available for query: ${operation}`)
}

/**
 * Extracts the operation name from a raw GraphQL query string.
 *
 * @param query - A GraphQL query string (can be multiline)
 * @returns The extracted operation name, or "UnknownQuery" if not found
 */
function extractOperationName(query: string): string {
  const match = query.match(/(?:query|mutation)?\s*(\w+)/)
  return match?.[1] ?? 'UnknownQuery'
}
