'use client';

import Image from 'next/image';
import Link from 'next/link';

/**
 * TruthHire brand logo.
 *
 * Variants:
 *   - "icon":       Just the mark (blue dot + gradient pill). Best in navbars,
 *                   avatars, or anywhere space is tight.
 *   - "full":       Mark + "truthhire.in" wordmark, side by side.
 *   - "stacked":    Full brand image (mark + wordmark + tagline) as one image.
 *
 * The icon is a hand-tuned SVG so it stays crisp at any resolution — no PNG
 * blurring, no extra network requests. The gradient + colors match the
 * uploaded brand PNG exactly.
 */

type LogoVariant = 'icon' | 'full' | 'stacked';

interface LogoProps {
  variant?: LogoVariant;
  /** Height in pixels. Width scales proportionally. Default varies per variant. */
  size?: number;
  /** Extra classes on the outer wrapper. */
  className?: string;
  /** Extra classes on the wordmark <span>. */
  wordmarkClassName?: string;
  /** Wrap the logo in a Link to "/". Default true for navigation contexts. */
  href?: string | null;
  /** Show the ".in" TLD in the wordmark. Default true (matches the brand). */
  showTld?: boolean;
  /** Priority load for above-the-fold placements. */
  priority?: boolean;
}

/* --- Inline SVG mark: dot + gradient pill -------------------------------- */
export function LogoMark({
  size = 28,
  className = '',
  title = 'TruthHire',
}: {
  size?: number;
  className?: string;
  title?: string;
}) {
  // Unique gradient id per instance so multiple marks on one page don't clash
  const gid = `th-grad-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <defs>
        <linearGradient id={gid} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4A6BFF" />
          <stop offset="50%" stopColor="#2C46F0" />
          <stop offset="100%" stopColor="#1730D6" />
        </linearGradient>
      </defs>
      {/* Small dot (top-left) */}
      <circle cx="27" cy="34" r="12" fill={`url(#${gid})`} />
      {/* Gradient pill (bottom-right, tilted ~20°) */}
      <rect
        x="53"
        y="30"
        width="20"
        height="52"
        rx="10"
        ry="10"
        transform="rotate(20 63 56)"
        fill={`url(#${gid})`}
      />
    </svg>
  );
}

/* --- Main component ------------------------------------------------------ */
export default function Logo({
  variant = 'full',
  size,
  className = '',
  wordmarkClassName = '',
  href = '/',
  showTld = true,
  priority = false,
}: LogoProps) {
  const iconSize = size ?? (variant === 'icon' ? 32 : variant === 'stacked' ? 40 : 28);

  const content = (() => {
    if (variant === 'stacked') {
      // Full brand PNG (icon + wordmark + tagline) — for hero areas / auth cards
      const h = size ?? 56;
      return (
        <Image
          src="/brand/truthhire-logo.png"
          alt="TruthHire — AI Powered Job Platform"
          width={h * 4.23} // aspect ratio of the exported PNG ~4.23:1
          height={h}
          priority={priority}
          className="h-auto w-auto max-h-full select-none"
          style={{ height: h, width: 'auto' }}
        />
      );
    }

    if (variant === 'icon') {
      return <LogoMark size={iconSize} />;
    }

    // Default: "full" -> mark + wordmark
    return (
      <>
        <LogoMark size={iconSize} />
        <span
          className={`text-white font-semibold tracking-tight leading-none ${wordmarkClassName}`}
          style={{ fontSize: iconSize * 0.78 }}
        >
          truthhire{showTld && <span className="text-white/70">.in</span>}
        </span>
      </>
    );
  })();

  const wrapperClasses = `inline-flex items-center gap-2 select-none ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        aria-label="TruthHire home"
        className={`${wrapperClasses} group`}
      >
        {content}
      </Link>
    );
  }

  return <span className={wrapperClasses}>{content}</span>;
}
