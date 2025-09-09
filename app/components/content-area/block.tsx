import dynamic from 'next/dynamic'
import blocksMapperFactory from '@/lib/utils/block-factory'

/**
 * Dynamically imports the placeholder component used when a CMS block type
 * is missing or not yet mapped. This ensures the page renders gracefully
 * without crashing.
 */
const PlaceholderBlock = dynamic(() => import('./placeholder-block'))

/**
 * Dynamically imports each known CMS block used by the application.
 *
 * Block filenames should match their `__typename` from the CMS schema exactly
 * (e.g. `HeroBlock` maps to `hero-block.tsx`).
 *
 * Using `dynamic()` enables lazy loading, improves performance,
 * and allows tree-shaking / bundle splitting to keep initial loads small.
 */
const HeroBlock = dynamic(() => import('../ui/hero-block')) // ✅ Add more as needed

/**
 * Maps CMS block `__typename` values to their corresponding React components.
 *
 * Extend this map to support additional blocks as they are defined in the CMS schema.
 * Any unmapped block will fall back to `UnknownBlock`, which renders the placeholder UI.
 *
 * This indirection also ensures that unused blocks are not bundled,
 * helping optimise build size.
 *
 * @example
 * export const blocks = {
 *   HeroBlock: dynamic(() => import('./hero-block')),
 *   ImageBlock: dynamic(() => import('./image-block')),
 *   UnknownBlock: PlaceholderBlock,
 * }
 */
export const blocks = {
  HeroBlock,
  UnknownBlock: PlaceholderBlock,
}

/**
 * Creates a block-mapping function from the `blocks` map.
 *
 * Used by `ContentAreaMapper` to resolve a block’s `__typename`
 * into the correct React component.
 *
 * @returns A factory function that safely maps CMS block types to React components.
 */
export default blocksMapperFactory(blocks)
