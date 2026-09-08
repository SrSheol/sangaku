/**
 * Original hand-authored SVG motifs for the Sangaku sumi-e identity.
 * No external art, no brand assets — brush strokes, seals and grain
 * are procedural / hand-drawn paths tuned for this app only.
 */

/**
 * Hidden SVG filter defs shared by every "washi-frame" surface (cards,
 * panels, modals, columns…). feTurbulence + feDisplacementMap bends a
 * crisp rectangle into a hand-brushed, slightly wobbly outline. Mounted
 * once near the app root; every surface references it by id.
 */
export function InkFilters() {
  return (
    <svg className="ink-defs" aria-hidden focusable="false">
      <defs>
        <filter id="ink-wobble" x="-20%" y="-20%" width="140%" height="140%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.018" numOctaves="2" seed="4" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="7" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id="ink-wobble-sm" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.07" numOctaves="2" seed="9" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </defs>
    </svg>
  )
}

export function SealMark({ size = 44, glyph = '算' }: { size?: number; glyph?: string }) {
  const id = `seal-grain-${glyph.charCodeAt(0)}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="seal-mark"
      role="img"
      aria-label="Sello Sangaku"
    >
      <defs>
        <filter id={id}>
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.55 0" />
        </filter>
      </defs>
      <path
        d="M50 4c25.4 0 42 8.6 44.6 33.7 2.4 22.8-6.2 39.7-19.3 51C63.8 98.4 41 99.7 24.8 89 8 77.8 2.6 57 6.2 37.4 10 16.6 26.7 4 50 4Z"
        fill="var(--vermillion)"
      />
      <path
        d="M50 4c25.4 0 42 8.6 44.6 33.7 2.4 22.8-6.2 39.7-19.3 51C63.8 98.4 41 99.7 24.8 89 8 77.8 2.6 57 6.2 37.4 10 16.6 26.7 4 50 4Z"
        fill={`url(#${id})`}
        opacity="0.5"
        style={{ filter: `url(#${id})` }}
      />
      <rect x="16" y="16" width="68" height="68" fill="none" stroke="var(--washi)" strokeWidth="3" opacity="0.85" />
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontSize="42"
        fontFamily="var(--font-jp)"
        fill="var(--washi)"
      >
        {glyph}
      </text>
    </svg>
  )
}

/** A single-pass hand-drawn brush stroke used as a section divider. */
export function BrushDivider({ className = '' }: { className?: string }) {
  return (
    <svg
      className={`brush-divider ${className}`}
      viewBox="0 0 640 20"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path
        d="M2 12c60-9 120 6 180-2 55-7 95 8 150 1 60-8 130 5 186-3 46-6 88 1 120-3"
        fill="none"
        stroke="var(--ink)"
        strokeWidth="7"
        strokeLinecap="round"
        opacity="0.85"
      />
      <path
        d="M4 9c80-6 150 4 210-1 58-4 100 5 150 0 62-5 120 3 176-2"
        fill="none"
        stroke="var(--vermillion)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.55"
      />
    </svg>
  )
}

/** Torn / deckled paper edge, used to break the rectangle-everywhere pattern. */
export function TornEdge({ flip = false }: { flip?: boolean }) {
  return (
    <svg
      className={`torn-edge${flip ? ' is-flip' : ''}`}
      viewBox="0 0 400 14"
      preserveAspectRatio="none"
      aria-hidden
    >
      <path d="M0 14 L0 6 6 8 14 3 24 9 34 2 44 7 56 1 68 8 80 3 92 9 104 2 116 7 128 1 140 8 152 4 164 9 176 2 188 7 200 1 212 8 224 3 236 9 248 2 260 7 272 1 284 8 296 4 308 9 320 2 332 7 344 1 356 8 368 3 380 9 392 2 400 6 400 14 Z" />
    </svg>
  )
}

/** Distant ink-wash mountain range, used for empty states and quiet corners. */
export function MountainWash({ className = '' }: { className?: string }) {
  return (
    <svg className={`mountain-wash ${className}`} viewBox="0 0 500 140" aria-hidden preserveAspectRatio="xMidYMax slice">
      <path d="M0 120 L70 55 L120 95 L170 40 L230 100 L280 60 L340 110 L400 50 L460 100 L500 75 L500 140 L0 140 Z" fill="var(--ink)" opacity="0.12" />
      <path d="M0 130 L90 85 L150 115 L210 70 L260 120 L330 90 L390 125 L440 95 L500 118 L500 140 L0 140 Z" fill="var(--ink)" opacity="0.2" />
    </svg>
  )
}

/**
 * A single-line sumi-e brush fish (koi), original hand-authored path —
 * no stock art. Body is one loose ink stroke; the tail is a separate
 * group so callers can sway it independently via the `.koi-tail` class.
 */
export function KoiFish({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 140 60"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M6 32c8-14 24-22 40-22 14 0 22 8 30 8 6 0 10-4 14-9-2 8-7 14-7 14s8 3 13 11c-6 2-12-1-16-4-6 8-16 14-30 14-18 0-38-8-44-12Z"
        fill="currentColor"
        opacity="0.9"
      />
      <path
        d="M30 20c6 2 11 6 13 12M50 17c6 1 12 5 15 11M22 40c8 3 20 4 30 1"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.5"
      />
      <circle cx="18" cy="28" r="1.6" fill="currentColor" opacity="0.85" />
      <g className="koi-tail">
        <path
          d="M92 30c6-8 16-14 26-15-4 6-6 11-6 15s2 9 6 15c-10-1-20-7-26-15Z"
          fill="currentColor"
          opacity="0.75"
        />
      </g>
    </svg>
  )
}

/** Small carved numeral used in the seal-rail navigation. */
export const KANJI_NUM: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
}
