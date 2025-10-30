'use client'

import { createContext, useContext } from 'react'

/**
 * React context that tracks whether the app is currently running
 * in edit mode (e.g. Optimizely Visual Builder or draft preview).
 *
 * Defaults to `false` when not provided.
 *
 * @example
 * ```tsx
 * import { EditModeProvider, useIsEditMode } from '@/app/context/edit-mode-context'
 *
 * export default function Layout({ children }) {
 *   const isEditMode = true // derive from draftMode() or VB flag
 *   return (
 *     <EditModeProvider value={isEditMode}>
 *       {children}
 *     </EditModeProvider>
 *   )
 * }
 *
 * function MyComponent() {
 *   const editMode = useIsEditMode()
 *   return editMode ? <p>Editing...</p> : <p>Published view</p>
 * }
 * ```
 */
const EditModeContext = createContext(false)

/**
 * Provider component for the {@link EditModeContext}.
 * Wrap your component tree with this to make edit mode state available globally.
 */
export const EditModeProvider = EditModeContext.Provider

/**
 * Hook that returns `true` if the current React tree is being rendered
 * in edit mode (Visual Builder or draft preview).
 *
 * @returns {boolean} `true` when in edit mode, otherwise `false`.
 */
export const useIsEditMode = (): boolean => useContext(EditModeContext)