export type LinkTarget = '_self' | '_blank'

/**
 * Minimal link shape that maps cleanly from Optimizely's LinkItem.
 * If your LinkItem has different names, map them before passing to CTAButton.
 */
export type LinkField = {
  /** Final computed URL (page, external, remaining URL) */
  href: string
  /** Open in target (defaults to _self) */
  openIn?: LinkTarget
  /** Optional rel override, e.g. 'nofollow' */
  rel?: string
  /** Optional aria-label for accessibility */
  ariaLabel?: string
}

export type CTAButtonStyle = 'red' | 'white'

export type CTAButtonProps = {
  textDesktop: string
  textMobile?: string // falls back to textDesktop
  link?: LinkField
  style?: CTAButtonStyle // default 'red'
  className?: string
  onClick?: () => void
  /** If true, call onCloseBar() after click. Parent can close Notification Bar. */
  closeBarOnClick?: boolean
  /** Optional hook the parent (notification bar) provides */
  onCloseBar?: () => void
}
