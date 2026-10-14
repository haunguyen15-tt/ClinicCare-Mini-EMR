import type { Config } from 'tailwindcss'

// Mobile-first: base classes target small phones, `sm:`/`md:`/`lg:`/`xl:` widen from there.
// The default Tailwind breakpoints are kept on purpose.
export default {
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
        },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
    },
  },
} satisfies Partial<Config>
