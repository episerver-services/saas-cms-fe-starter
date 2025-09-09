import { createElement, ComponentType } from 'react'

/**
 * A mapping of content type names (CMS-provided `__typename`s) to React components.
 */
type ComponentMap = Record<string, ComponentType<any>>

/**
 * Factory creator that maps CMS content types to React components for dynamic rendering.
 *
 * Ensures that props passed to the factory match the expected props of the mapped component
 * (via `React.ComponentProps`). If a content type is not found in the map, the factory
 * safely returns `null` instead of throwing.
 *
 * Usage Note:
 * Typically this factory is wrapped by a higher-level renderer such as a
 * `ContentAreaMapper` or `SlotRenderer`. These renderers iterate over CMS blocks
 * and call the factory with the correct `__typename` and props, ensuring layout-driven
 * rendering for Visual Builder and other CMS features.
 *
 * @template TMap - A map of content type names to React component types.
 * @param contentTypeMap - The object mapping type names to their corresponding components.
 * @returns A factory function that dynamically renders a component based on the given type name and props.
 *
 * @example
 * ```tsx
 * const factory = blocksMapperFactory({
 *   HeroBlock: HeroComponent,
 *   TextBlock: TextComponent,
 * });
 *
 * // Renders <HeroComponent title="Welcome!" />
 * factory({ typeName: 'HeroBlock', props: { title: 'Welcome!' } });
 *
 * // Returns null because "MissingBlock" is not mapped
 * factory({ typeName: 'MissingBlock', props: {} });
 * ```
 */
export default function blocksMapperFactory<TMap extends ComponentMap>(
  contentTypeMap: TMap
) {
  /**
   * Creates a React element based on the content block type and its props.
   *
   * @template TypeName - The name of the component type from the component map.
   * @param options - An object containing the typeName and corresponding props.
   * @returns A React element of the matched component type, or `null` if not found.
   */
  function factory<TypeName extends keyof TMap>({
    typeName,
    props,
  }: {
    typeName: TypeName
    props: React.ComponentProps<TMap[TypeName]>
  }) {
    const Component = contentTypeMap[typeName]
    return Component ? createElement(Component, props) : null
  }

  return factory
}
