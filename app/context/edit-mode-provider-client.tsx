'use client'

import { EditModeProvider } from './edit-mode-context'

/**
 * Client wrapper for the EditModeProvider to allow safe use
 * inside async server components (e.g. draft layouts).
 */
export default function EditModeProviderClient({
  value,
  children,
}: {
  value: boolean
  children: React.ReactNode
}) {
  return <EditModeProvider value={value}>{children}</EditModeProvider>
}
