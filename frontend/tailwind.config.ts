import type { Config } from 'tailwindcss'
import colors from 'tailwindcss/colors'

// Mobile-first: base classes target small phones, `sm:`/`md:`/`lg:`/`xl:` widen from there.
// The default Tailwind breakpoints are kept on purpose.
export default {
  theme: {
    extend: {
      colors: {
        brand: colors.teal,
      },
    },
  },
} satisfies Partial<Config>
