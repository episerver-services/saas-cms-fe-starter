// -----------------------------------------------------------------------------
// This is a placeholder implementation of a primary Call-to-Action
// button. It implements example behaviour and class structure,
// while keeping the visual system minimal until final design tokens and
// styles are agreed.
//
// Notes
// - Final colours, sizes and typography should be consolidated into Tailwind
//   config / CSS variables.
// - This component intentionally supports internal, external and “no-link”
//   (button) modes to cover all CTA use-cases across the site.
// -----------------------------------------------------------------------------

'use client'

import Link from 'next/link'
import { twMerge } from 'tailwind-merge'
import type { CTAButtonProps } from './cta-button.types'

/**
 * Determine whether a provided href points to an external destination.
 *
 * External is defined as:
 * - Absolute HTTP(S) URL, or
 * - `mailto:` link, or
 * - `tel:` link.
 *
 * @param href - The candidate link to inspect.
 * @returns True if the link should render as an external `<a>`.
 */
function isExternal(href: string): boolean {
  return (
    /^https?:\/\//i.test(href) ||
    href.startsWith('mailto:') ||
    href.startsWith('tel:')
  )
}

/**
 * Compute Tailwind classes for the CTA visual variant.
 *
 * Variants:
 * - `"red"` (default): brand background with white text.
 * - `"white"`: white background with neutral border and text.
 *
 * @param style - Visual style variant name.
 * @returns A merged Tailwind class string.
 */
function variantClasses(style: CTAButtonProps['style']): string {
  const base =
    'inline-flex items-center justify-center rounded-full px-6 py-3 text-[16px] font-bold uppercase transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2'

  if (style === 'white') {
    return twMerge(
      base,
      'bg-white text-textMain border border-borderLight hover:brightness-95'
    )
  }

  // default: "red"
  return twMerge(
    base,
    // Uses a CSS variable for brand red so theming can swap values centrally.
    'bg-brand text-white hover:bg-[rgb(var(--brand-red-hover))]'
  )
}

/**
 * CTAButton – Reusable site-wide call-to-action.
 *
 * Renders as:
 * - `<button>` when `link.href` is not provided
 * - Next.js `<Link>` for internal routes
 * - `<a>` for external links (`http(s)`, `mailto`, `tel`)
 *
 * Features:
 * - Separate desktop and mobile labels
 * - Visual variants (`"red"` or `"white"`)
 * - Optional `onClick` handling
 * - Optional “close bar” behaviour via `closeBarOnClick` + `onCloseBar`
 *
 * Accessibility:
 * - When rendering as a link, `link.ariaLabel` can be supplied for screen readers.
 *
 * @param textDesktop - Label shown on desktop viewports.
 * @param textMobile - Optional label override for smaller viewports; falls back to `textDesktop`.
 * @param link - Optional link config; if omitted, a `<button>` is rendered.
 * @param style - Visual variant; `"red"` (default) or `"white"`.
 * @param className - Optional Tailwind class overrides/extensions.
 * @param onClick - Optional click handler for custom behaviour.
 * @param closeBarOnClick - If true, calls `onCloseBar` after click.
 * @param onCloseBar - Optional handler for closing a surrounding UI bar.
 * @returns A CTA element appropriate for the input props.
 */
export default function CTAButton({
  textDesktop,
  textMobile,
  link,
  style = 'red',
  className,
  onClick,
  closeBarOnClick,
  onCloseBar,
}: CTAButtonProps) {
  const labelMobile = (textMobile?.trim() || textDesktop).trim()
  const classes = twMerge(variantClasses(style), className)

  /**
   * Combined click handler that always runs the caller’s `onClick`,
   * and optionally triggers the close-bar interaction if requested.
   */
  const handleClick = () => {
    onClick?.()
    if (closeBarOnClick && typeof onCloseBar === 'function') {
      onCloseBar()
    }
  }

  // ───────────────────────────────────────────────────────────────────────────
  // No link supplied → render as <button>
  // ───────────────────────────────────────────────────────────────────────────
  if (!link?.href) {
    return (
      <button type="button" className={classes} onClick={handleClick}>
        <span className="lg:hidden">{labelMobile}</span>
        <span className="hidden lg:inline">{textDesktop}</span>
      </button>
    )
  }

  // Build rel for external targets safely
  const rel =
    link.openIn === '_blank'
      ? ['noopener', 'noreferrer', link.rel].filter(Boolean).join(' ')
      : link.rel || undefined

  // ───────────────────────────────────────────────────────────────────────────
  // Internal route → Next.js <Link>
  // ───────────────────────────────────────────────────────────────────────────
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

  // ───────────────────────────────────────────────────────────────────────────
  // External destination → <a>
  // ───────────────────────────────────────────────────────────────────────────
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
