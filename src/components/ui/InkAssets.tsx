/**
 * Original hand-authored SVG motifs for the Sangaku sumi-e identity.
 * No external art, no brand assets — brush strokes, seals and grain
 * are procedural / hand-drawn paths tuned for this app only.
 */

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

/** Small carved numeral used in the seal-rail navigation. */
export const KANJI_NUM: Record<number, string> = {
  1: '一',
  2: '二',
  3: '三',
  4: '四',
}
