import { createElement, ComponentType } from 'react'

/**
 * A mapping of content type names to their corresponding React components.
 */
type ComponentMap = Record<string, ComponentType<any>>

/**
 * Factory creator that maps content types to React components for dynamic rendering.
 *
 * @template TMap - A map of content type names to React component types.
 * @param contentTypeMap - The object mapping type names to their corresponding components.
 * @returns A factory function that dynamically renders a component based on the given type name and props.
 *
 * @example
 * const factory = blocksMapperFactory({ HeroBlock: HeroComponent });
 * factory({ typeName: 'HeroBlock', props: { title: 'Welcome!' } });
 */
export default function blocksMapperFactory<TMap extends ComponentMap>(
  contentTypeMap: TMap
) {
  /**
   * Creates a React element based on the content block type and its props.
   *
   * @template TypeName - The name of the component type from the component map.
   * @param options - An object containing the typeName and corresponding props.
   * @returns A React element of the matched component type, or null if not found.
   */
  function factory<TypeName extends keyof TMap>({
    typeName,
    props,
  }: {
    typeName: TypeName
    props: React.ComponentProps<TMap[TypeName]>
  }) {
    const Component = contentTypeMap[typeName]

    if (!Component) {
      return null
    }

    return createElement(Component, props)
  }

  return factory
}
