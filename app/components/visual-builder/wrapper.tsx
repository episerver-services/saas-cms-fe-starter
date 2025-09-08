import ContentAreaMapper from '../content-area/mapper'
import type {
  Column,
  Row,
  VisualBuilderNode,
  SafeVisualBuilderExperience,
} from '@/lib/optimizely/types/experience'

/**
 * Renders a Visual Builder experience based on layout composition.
 * Supports both `section` and `component` node types.
 *
 * @param experience - The Visual Builder experience object containing layout nodes
 * @returns Rendered layout or `null` if invalid
 */
export default function VisualBuilderExperienceWrapper({
  experience,
}: {
  experience?: SafeVisualBuilderExperience
}) {
  if (!experience?.composition?.nodes) {
    return null
  }

  const { nodes } = experience.composition

  return (
    <div className="vb:outline relative w-full flex-1">
      <div className="vb:outline relative w-full flex-1">
        {nodes.map((node: VisualBuilderNode) => {
          // Render section with rows and columns
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

          // Render standalone component node
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

          return null
        })}
      </div>
    </div>
  )
}
