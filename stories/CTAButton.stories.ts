import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import CTAButton from '@/app/components/ui/cta-button'
import type { CTAButtonProps } from '@/app/components/ui/cta-button/cta-button.types'

const meta: Meta<typeof CTAButton> = {
  title: 'Components/CTAButton',
  component: CTAButton,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
    },
  },
}
export default meta

type Story = StoryObj<typeof CTAButton>

const commonProps: Pick<
  CTAButtonProps,
  'textDesktop' | 'textMobile' | 'onCloseBar'
> = {
  textDesktop: 'Get Started',
  textMobile: 'Start',
  onCloseBar: () => alert('Close bar triggered'),
}

// 👇 RED variant (default)
export const Default: Story = {
  args: {
    ...commonProps,
    style: 'red',
    link: {
      href: '/get-started',
      ariaLabel: 'Get started with our service',
      openIn: '_self',
    },
  },
}

// 👇 WHITE variant
export const WhiteVariant: Story = {
  args: {
    ...commonProps,
    style: 'white',
    link: {
      href: '/learn-more',
      ariaLabel: 'Learn more about our platform',
    },
  },
}

// 👇 External link
export const ExternalLink: Story = {
  args: {
    ...commonProps,
    link: {
      href: 'https://example.com',
      openIn: '_blank',
      rel: 'noopener',
      ariaLabel: 'Visit external website',
    },
  },
}

// 👇 Mobile view
export const MobileView: Story = {
  args: {
    ...commonProps,
    link: {
      href: '/mobile-only',
      ariaLabel: 'Mobile action',
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
}