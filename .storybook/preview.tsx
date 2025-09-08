import '../app/globals.css'
import type { Preview } from '@storybook/nextjs-vite'
import Header from '../app/components/layout/header/header'
import Footer from '../app/components/layout/footer'

// Optional: viewports aligned to your Tailwind breakpoints
const tailwindViewports = {
  mobile: { name: 'Mobile (375)', styles: { width: '375px', height: '812px' } },
  md: { name: 'Tablet (md 768)', styles: { width: '768px', height: '1024px' } },
  lg: {
    name: 'Laptop (lg 1024)',
    styles: { width: '1024px', height: '768px' },
  },
  xl: {
    name: 'Desktop (xl 1280)',
    styles: { width: '1280px', height: '800px' },
  },
}

const preview: Preview = {
  parameters: {
    layout: 'fullscreen',
    viewport: { viewports: tailwindViewports },
    controls: {
      matchers: { color: /(background|color)$/i, date: /Date$/i },
    },
    a11y: { test: 'todo' },
  },

  // Only add Header/Footer when a story asks for it
  decorators: [
    (Story, context) => {
      const withChrome = context.parameters.withChrome === true
      if (!withChrome) return <Story />

      return (
        <>
          <Header />
          <main className="mx-auto w-full max-w-[1800px] px-5 sm:px-10 md:px-20 py-8">
            <Story />
          </main>
          <Footer />
        </>
      )
    },
  ],
}

export default preview
