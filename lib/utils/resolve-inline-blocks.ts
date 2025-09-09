import { optimizely } from '../optimizely/fetch'
import type { SafeContent as IContent } from '../optimizely/types/type-utils'

/**
 * Resolves any shared or inline blocks within a CMS page.
 * A "stub" is a block that only includes __typename + _metadata.key.
 */
export async function resolveInlineBlocks(
  blocks: (IContent | null | undefined)[]
): Promise<IContent[]> {
  const resolved: IContent[] = []
  const unresolvedKeys = new Set<string>()

  for (const block of blocks) {
    if (!block) continue

    const meta = (block as { _metadata?: { key?: string } } | null)?._metadata
    const keys = Object.keys(block)

    // Treat as stub if it only has __typename/_metadata and provides a key
    const isStub =
      !!meta?.key && keys.every((k) => k === '__typename' || k === '_metadata')

    if (isStub) {
      unresolvedKeys.add(meta!.key!)
    } else {
      resolved.push(block)
    }
  }

  // Fetch any unresolved stubs by key (deduped)
  if (unresolvedKeys.size) {
    for (const key of unresolvedKeys) {
      const result = await optimizely.GetContentByGuid({ guid: key })
      const fetched = result?._Content?.items?.[0]
      if (fetched) {
        resolved.push(fetched as unknown as IContent)
      }
    }
  }

  return resolved
}
