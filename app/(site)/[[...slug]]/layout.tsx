import SharedPageLayout from '@/app/components/layout/shared-page-layout'
import { Heading } from '@/app/components/ui/heading'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <SharedPageLayout>
      <Heading label="Published Route" />
      {children}
    </SharedPageLayout>
  )
}
