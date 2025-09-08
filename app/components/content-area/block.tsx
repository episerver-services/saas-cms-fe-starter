import dynamic from 'next/dynamic'
import blocksMapperFactory from '@/lib/utils/block-factory'

/**
 * Dynamically import the fallback component used when a CMS block type
 * is missing or not yet mapped. This ensures the page renders without crashing.
 */
const PlaceholderBlock = dynamic(() => import('./placeholder-block'))

/**
 * Dynamically import each known CMS block used by the application.
 *
 * Block filenames should match their `__typename` from the CMS exactly
 * (e.g. `HeroBlock` maps to `hero-block.tsx`).
 *
 * Use `dynamic()` to enable lazy loading and improve performance.
 */
const HeroBlock = dynamic(() => import('../ui/hero-block')) // ✅ Add more as needed

/**
 * A mapping of CMS block `__typename` values to their corresponding React components.
 *
 * Extend this map to support additional blocks as they're defined in the CMS schema.
 * Unrecognized blocks will default to `UnknownBlock`, which renders a fallback UI.
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
 * Returns a function that maps a `__typename` from the CMS
 * to the correct React component.
 *
 * This factory handles fallback logic and is used by `ContentAreaMapper`
 * to render individual blocks safely, even if unmapped.
 */
export default blocksMapperFactory(blocks)
