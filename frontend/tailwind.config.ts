import type { Config } from 'tailwindcss'
import defaultTheme from 'tailwindcss/defaultTheme'
import plugin from 'tailwindcss/plugin'

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
      colors: {
        paper: { DEFAULT: token('paper'), deep: token('paper-deep') },
        card: token('card'),
        rule: { DEFAULT: token('rule'), strong: token('rule-strong') },
        ink: { DEFAULT: token('ink'), soft: token('ink-soft'), faint: token('ink-faint') },
        pine: { DEFAULT: token('pine'), deep: token('pine-deep') },
        accent: { DEFAULT: token('accent'), soft: token('accent-soft') },
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
        // Individual `translate`/`scale` properties, not `transform`: the animation then
        // composes with Tailwind's rotate/translate utilities instead of overriding them.
        rise: {
          from: { opacity: '0', translate: '0 10px' },
          to: { opacity: '1', translate: 'none' },
        },
        'draw-rule': {
          from: { scale: '1 0' },
          to: { scale: '1 1' },
        },
      },
      animation: {
        // `backwards`, not `both`: the end state equals the element's own style, and an
        // opacity animation that stays filled keeps a stacking context, which would trap a
        // dropdown (the DiagnosisPicker list) under the next revealed block.
        rise: 'rise 0.6s cubic-bezier(0.22, 1, 0.36, 1) backwards',
        'draw-rule': 'draw-rule 0.9s cubic-bezier(0.65, 0, 0.35, 1) both',
      },
    },
  },
  plugins: [
    // `short:` for phones held sideways: wide enough for `sm`/`md` but only ~350-450px tall.
    // A variant rather than a raw `screens` entry, which would disable `max-*`/`min-[...]` screens.
    // Tailwind emits it before the screen variants, so `:root` gives it the specificity to win.
    plugin(({ addVariant }) => {
      addVariant('short', '@media (orientation: landscape) and (max-height: 500px) { :root & }')
    }),
  ],
} satisfies Partial<Config>
