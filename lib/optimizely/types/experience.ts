// Removed: import type { SeoExperience } from '../sdk'

// Temporary fallback type to avoid missing codegen types
export interface FallbackSeoExperience {
  __typename: string
  _metadata?: {
    version?: string
    [key: string]: unknown
  }
  composition?: {
    displayName?: string
    nodes?: {
      displaySettings?: Record<string, unknown>
      component?: {
        __typename: string
        [key: string]: unknown
      }
      key: string
    }[]
  }
}

export interface Grid {
  key: string
  rows?: Row[]
}

export interface Row {
  key: string
  columns?: Column[]
}

export interface Column {
  key: string
  elements?: ExperienceElement[]
}

export interface ExperienceElement {
  key: string
  displaySettings?: {
    value: string
    key: string
  }[]
  component?: any
}

export interface VisualBuilderNode {
  nodeType: 'section' | 'component'
  key: string
  component?: any
  rows?: Row[]
}

// 👇 This replaces the broken `SeoExperience` type
export type SafeVisualBuilderExperience = {
  composition?: {
    nodes?: VisualBuilderNode[]
  }
} & FallbackSeoExperience
