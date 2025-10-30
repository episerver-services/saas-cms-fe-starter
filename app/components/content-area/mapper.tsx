import { ExperienceElement } from '@/lib/optimizely/types/experience'
import Block from './block'

/**
 * ContentAreaMapper
 *
 * Maps a list of CMS blocks or Visual Builder components to React output.
 * Handles both standard CMS block rendering and Visual Builder (VB) experience layouts.
 * Supports recursive slot rendering for nested areas.
 *
 * @param blocks - Array of CMS blocks to render (non-VB mode only).
 * @param preview - Whether preview mode is enabled (adds edit hints and props).
 * @param isVisualBuilder - If true, renders Visual Builder layout elements instead of CMS blocks.
 * @param experienceElements - Array of Visual Builder composition elements to render.
 *
 * @returns React elements representing the mapped blocks or VB components,
 *          or `null` if nothing is provided.
 */
function ContentAreaMapper({
  blocks,
  preview = false,
  isVisualBuilder = false,
  experienceElements,
}: {
  blocks?: any[] | null
  preview?: boolean
  isVisualBuilder?: boolean
  experienceElements?: ExperienceElement[] | null
}) {
  // 🔹 Visual Builder rendering
  if (isVisualBuilder) {
    if (!experienceElements || experienceElements.length === 0) return null

    return (
      <>
        {experienceElements.map(
          ({ displaySettings, component, key }, index) => (
            <div
              key={`${component?.__typename ?? 'unknown'}--${index}`}
              data-epi-block-id={key}
              data-epi-edit={component?.__typename ?? 'component'}
            >
              <Block
                typeName={component?.__typename}
                props={{
                  ...component,
                  displaySettings,
                  isFirst: index === 0,
                  preview,
                }}
              />
              {/* 🔁 Recursive slot rendering for nested areas */}
              {renderNestedSlots(component, preview)}
            </div>
          )
        )}
      </>
    )
  }

  // 🔹 CMS block rendering
  if (!blocks || blocks.length === 0) return null

  return (
    <>
      {blocks.map(({ __typename, ...props }, index) => (
        <div
          key={`${__typename ?? 'unknown'}--${index}`}
          data-epi-block-id={props.key ?? `cms-block-${index}`}
          data-epi-edit={__typename ?? 'block'}
        >
          <Block
            typeName={__typename}
            props={{
              ...props,
              isFirst: index === 0,
              preview,
            }}
          />
          {/* 🔁 Recursive slot rendering for nested areas */}
          {renderNestedSlots(props, preview)}
        </div>
      ))}
    </>
  )
}

/**
 * Recursively renders nested slot areas found inside a block’s props.
 * Slots are identified by keys with the shape `{ items: Block[] }`.
 *
 * @param props - Raw props passed to a Block component.
 * @param preview - Whether preview mode is enabled.
 * @returns React elements for all nested slot areas, or `null` if none exist.
 */
function renderNestedSlots(props: Record<string, any>, preview: boolean) {
  const slotKeys = Object.keys(props).filter(
    (key) => props[key]?.items && Array.isArray(props[key].items)
  )

  if (slotKeys.length === 0) return null

  return (
    <>
      {slotKeys.map((slotKey) => {
        const nestedBlocks = props[slotKey]?.items
        if (!nestedBlocks || nestedBlocks.length === 0) return null

        return (
          <div
            key={`slot--${slotKey}`}
            data-slot-area={slotKey}
            data-epi-edit="slot"
          >
            <ContentAreaMapper blocks={nestedBlocks} preview={preview} />
          </div>
        )
      })}
    </>
  )
}

export default ContentAreaMapper