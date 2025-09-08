import type { Config } from 'tailwindcss'

export default {
  darkMode: ['class'],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      max: '1800px',
    },
    extend: {
      colors: {
        background: 'rgb(var(--background) / <alpha-value>)',
        foreground: 'rgb(var(--foreground) / <alpha-value>)',
        border: 'rgb(var(--border) / <alpha-value>)',
        brand: 'rgb(var(--brand-red) / <alpha-value>)',
        brandHover: 'rgb(var(--brand-red-hover) / <alpha-value>)',
        textMain: 'rgb(var(--text-main) / <alpha-value>)',
        textMuted: 'rgb(var(--text-muted))',
        borderLight: 'rgb(var(--border-light))',
      },
      borderColor: {
        DEFAULT: 'rgb(var(--border) / <alpha-value>)',
      },
      backgroundColor: {
        DEFAULT: 'rgb(var(--background) / <alpha-value>)',
      },
      textColor: {
        DEFAULT: 'rgb(var(--foreground) / <alpha-value>)',
      },
      borderRadius: {
        DEFAULT: 'var(--radius)',
      },
    },
  },
  plugins: [],
} satisfies Config
