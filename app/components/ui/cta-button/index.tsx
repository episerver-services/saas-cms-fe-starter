// This is a mock up of the current CTA button on the live site. The new styles will need to be added to the Tailwind
// config file and global CSS file. A lot of the mock data and layout can be reused. As of this typing
// the new site style and layout had not been finalised.
'use client'

import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import type { CTAButtonProps } from './cta-button.types'

/**
 * Determines if a link is external (URL, tel:, or mailto:).
 *
 * @param href - The link to check
 * @returns True if the link is external
 */
const isExternal = (href: string): boolean =>
  /^https?:\/\//i.test(href) ||
  href.startsWith('mailto:') ||
  href.startsWith('tel:')

/**
 * Returns Tailwind classes for button style variants.
 *
 * @param style - The style variant: "red" or "white"
 * @returns Combined Tailwind class string
 */
const variantClasses = (style: CTAButtonProps['style']) => {
  const base =
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-[16px] font-bold uppercase transition-colors duration-200 ease-in-out'

  if (style === 'white') {
    return twMerge(
      base,
      'bg-white text-textMain border border-borderLight hover:brightness-95'
    )
  }

  return twMerge(
    base,
    'bg-brand text-white hover:bg-[rgb(var(--brand-red-hover))]'
  )
}

/**
 * CTAButton – A reusable call-to-action button that supports:
 * - Internal and external links
 * - Responsive label text (desktop + mobile)
 * - Style variants (red, white)
 * - Optional click handler (onClick)
 * - Optional close-bar behaviour
 *
 * If no `link.href` is provided, it renders a <button> element instead of a <Link>/<a>.
 *
 * @param props - CTAButtonProps
 * @returns Rendered CTA element
 */
const CTAButton = ({
  textDesktop,
  textMobile,
  link,
  style = 'red',
  className,
  onClick,
  closeBarOnClick,
  onCloseBar,
}: CTAButtonProps) => {
  const labelMobile = textMobile?.trim() || textDesktop
  const classes = twMerge(variantClasses(style), className)

  /**
   * Combined click handler for manual and close-bar clicks.
   */
  const handleClick = () => {
    onClick?.()
    if (closeBarOnClick && typeof onCloseBar === 'function') {
      onCloseBar()
    }
  }

  // No link: Render as button (used for "Try again" etc.)
  if (!link?.href) {
    return (
      <button type="button" className={classes} onClick={handleClick}>
        <span className="lg:hidden">{labelMobile}</span>
        <span className="hidden lg:inline">{textDesktop}</span>
      </button>
    )
  }

  const rel =
    link.openIn === '_blank'
      ? ['noopener', 'noreferrer', link.rel].filter(Boolean).join(' ')
      : link.rel || undefined

  // Internal link
  if (!isExternal(link.href)) {
    return (
      <Link
        href={link.href}
        aria-label={link.ariaLabel}
        className={classes}
        onClick={handleClick}
      >
        <span className="lg:hidden">{labelMobile}</span>
        <span className="hidden lg:inline">{textDesktop}</span>
      </Link>
    )
  }

  // External link
  return (
    <a
      href={link.href}
      target={link.openIn || '_self'}
      rel={rel}
      aria-label={link.ariaLabel}
      className={classes}
      onClick={handleClick}
    >
      <span className="lg:hidden">{labelMobile}</span>
      <span className="hidden lg:inline">{textDesktop}</span>
    </a>
  )
}

export default CTAButton
