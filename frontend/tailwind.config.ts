import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'

// "Clinical chart" design system in a scrubs-and-sage palette: cool-white chart paper,
// surgical-green ink and an emerald margin rule. Colors are CSS variables
// (assets/css/tailwind.css) so opacity modifiers like `bg-ink/10` keep working.
//
// Mobile-first: base classes target small phones, `sm:`/`md:`/`lg:`/`xl:` widen from there.
// The default Tailwind breakpoints are kept on purpose.
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`

export default {
  theme: {
    extend: {
      screens: {
        // Phones held sideways: wide enough for `sm`/`md` but only ~350-450px tall.
        short: { raw: '(orientation: landscape) and (max-height: 500px)' },
      },
      colors: {
        paper: { DEFAULT: token('paper'), deep: token('paper-deep') },
        card: token('card'),
        rule: { DEFAULT: token('rule'), strong: token('rule-strong') },
        ink: { DEFAULT: token('ink'), soft: token('ink-soft'), faint: token('ink-faint') },
        pine: { DEFAULT: token('pine'), deep: token('pine-deep') },
        accent: { DEFAULT: token('accent'), soft: token('accent-soft') },
        mint: token('mint'),
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
      },
      fontFamily: {
        display: ['"Instrument Serif"', ...defaultTheme.fontFamily.serif],
        sans: ['"Hanken Grotesk Variable"', ...defaultTheme.fontFamily.sans],
        mono: ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono],
      },
      letterSpacing: {
        label: '0.14em',
      },
      boxShadow: {
        sheet: '0 1px 0 rgb(var(--rule) / 0.9), 0 12px 32px -18px rgb(var(--ink) / 0.35)',
      },
      keyframes: {
        rise: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'draw-rule': {
          from: { transform: 'scaleY(0)' },
          to: { transform: 'scaleY(1)' },
        },
      },
      animation: {
        rise: 'rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) both',
        'draw-rule': 'draw-rule 0.9s cubic-bezier(0.65, 0, 0.35, 1) both',
      },
    },
  },
} satisfies Partial<Config>
