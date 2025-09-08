import { ExperienceElement } from '@/lib/optimizely/types/experience'
import Block from './block'

/**
 * Maps a list of CMS blocks or Visual Builder components to React output.
 * Handles standard rendering and nested slot recursion.
 *
 * @param blocks - Array of CMS blocks to render (used in non-VB mode)
 * @param preview - Whether preview mode is enabled
 * @param isVisualBuilder - If true, renders VB-style layout elements
 * @param experienceElements - Array of VB composition components
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
  // Visual Builder rendering
  if (isVisualBuilder) {
    if (!experienceElements || experienceElements.length === 0) return null

    return (
      <>
        {experienceElements.map(
          ({ displaySettings, component, key }, index) => (
            <div
              data-epi-block-id={key}
              key={`${component?.__typename ?? 'unknown'}--${index}`}
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

  // CMS block rendering
  if (!blocks || blocks.length === 0) return null

  return (
    <>
      {blocks.map(({ __typename, ...props }, index) => (
        <div key={`${__typename ?? 'unknown'}--${index}`}>
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
 * Recursively renders any nested slots found inside a block's props.
 * Looks for fields that match the shape: { items: Block[] }
 *
 * @param props - The raw props passed to a Block component
 * @param preview - Whether preview mode is enabled
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
          <div key={`slot--${slotKey}`} data-slot-area={slotKey}>
            <ContentAreaMapper blocks={nestedBlocks} preview={preview} />
          </div>
        )
      })}
    </>
  )
}

export default ContentAreaMapper
