import { optimizely } from '../optimizely/fetch'
import type { SafeContent as IContent } from '../optimizely/types/type-utils'

/**
 * Resolves inline or shared block stubs into full CMS content blocks.
 *
 * A block may arrive from Optimizely in a "stub" form:
 * ```json
 * {
 *   "__typename": "HeroBlock",
 *   "_metadata": { "key": "guid-123" }
 * }
 * ```
 *
 * These stubs only include a `__typename` and `_metadata.key`.
 * This function detects them, fetches the full block data by GUID,
 * and merges the result with any already-resolved inline blocks.
 *
 * Deduplication is applied so the same key is not fetched more than once.
 *
 * @param blocks - An array of CMS content blocks (resolved or stubbed).
 * @returns A promise resolving to a list of fully resolved blocks.
 *
 * @example
 * ```ts
 * const blocks = await resolveInlineBlocks(page.blocks);
 * blocks.forEach((block) => {
 *   switch (block.__typename) {
 *     case 'HeroBlock':
 *       // render hero
 *       break;
 *   }
 * });
 * ```
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
