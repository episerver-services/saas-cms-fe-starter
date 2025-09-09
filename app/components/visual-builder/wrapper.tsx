import ContentAreaMapper from '../content-area/mapper'
import type {
  Column,
  Row,
  VisualBuilderNode,
  SafeVisualBuilderExperience,
} from '@/lib/optimizely/types/experience'

/**
 * Visual Builder experience renderer.
 *
 * Renders a layout composed of sections → rows → columns → elements, as provided
 * by Optimizely Visual Builder. Supports both `section` nodes (grid-style layout)
 * and `component` nodes (standalone component).
 *
 * - Sections: iterate rows → columns and render each column’s `elements` via
 *   `ContentAreaMapper` in Visual Builder mode.
 * - Components: render a single component via `ContentAreaMapper` in CMS-block mode.
 *
 * @param experience - A safe, normalized Visual Builder experience (composition + nodes).
 * @returns React output for the composition, or `null` when no nodes are available.
 */
export default function VisualBuilderExperienceWrapper({
  experience,
}: {
  experience?: SafeVisualBuilderExperience
}) {
  // Guard: nothing to render
  if (!experience?.composition?.nodes?.length) return null

  const { nodes } = experience.composition

  return (
    <div className="vb:outline relative w-full flex-1">
      {nodes.map((node: VisualBuilderNode) => {
        // SECTION: rows → columns → elements
        if (node.nodeType === 'section') {
          return (
            <div
              key={node.key}
              className="vb:grid relative flex w-full flex-col flex-wrap"
              data-epi-block-id={node.key}
            >
              {node.rows?.map((row: Row) => (
                <div
                  key={row.key}
                  className="vb:row flex flex-1 flex-col flex-nowrap md:flex-row"
                >
                  {row.columns?.map((column: Column) => (
                    <div
                      key={column.key}
                      className="vb:col flex flex-1 flex-col flex-nowrap justify-start"
                    >
                      <ContentAreaMapper
                        experienceElements={column.elements}
                        isVisualBuilder
                      />
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )
        }

        // COMPONENT: standalone component node
        if (node.nodeType === 'component' && node.component) {
          return (
            <div
              key={node.key}
              className="vb:node relative w-full"
              data-epi-block-id={node.key}
            >
              <ContentAreaMapper blocks={[node.component]} />
            </div>
          )
        }

        // Unknown/unsupported node
        return null
      })}
    </div>
  )
}
