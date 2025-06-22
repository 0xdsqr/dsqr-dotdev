import type { Config } from 'tailwindcss'
import { fontFamily } from 'tailwindcss/defaultTheme'
import tailwindAnimate from 'tailwindcss-animate'

const config = {
  darkMode: ["class"],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontSize: {
        '2xs': '0.625rem', // Extra-extra-small for mobile displays
      },
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        mono: ["var(--font-mono)", ...fontFamily.mono],
      },
      colors: {
        border: "var(--color-border)",
        input: "var(--color-input)",
        ring: "var(--color-ring)",
        background: "var(--color-background)",
        foreground: "var(--color-foreground)",
        primary: {
          DEFAULT: "var(--color-primary)",
          foreground: "var(--color-primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--color-secondary)",
          foreground: "var(--color-secondary-foreground)",
        },
        destructive: {
          DEFAULT: "var(--color-destructive)",
          foreground: "var(--color-destructive-foreground)",
        },
        muted: {
          DEFAULT: "var(--color-muted)",
          foreground: "var(--color-muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--color-accent)",
          foreground: "var(--color-accent-foreground)",
        },
        popover: {
          DEFAULT: "var(--color-popover)",
          foreground: "var(--color-popover-foreground)",
        },
        card: {
          DEFAULT: "var(--color-card)",
          foreground: "var(--color-card-foreground)",
        },
        purple: {
          400: "var(--color-purple-400)",
          500: "var(--color-purple-500)",
          600: "var(--color-purple-600)",
          700: "var(--color-purple-700)"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindAnimate],
} satisfies Config

export default config