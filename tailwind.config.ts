import type { Config } from 'tailwindcss';

/**
 * AgriJump Design Tokens — "Vintage Analog Campus"
 * Vintage moss green / sunset orange / film off-white
 */
const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}', './lib/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Film off-white (background)
        paper: {
          50: '#FBFAF6',
          100: '#F5F2E9',
          200: '#EBE6D8',
          300: '#DDD6C3',
          400: '#C4BBA3',
        },
        // Vintage moss green (brand primary)
        moss: {
          50: '#F1F5EA',
          100: '#DCE6CA',
          200: '#C0D0A2',
          300: '#9FB678',
          400: '#829C57',
          500: '#6A8343',
          600: '#566B36',
          700: '#42522B',
          800: '#313D21',
          900: '#212A17',
        },
        // Sunset orange (action / CTA)
        sunset: {
          100: '#FFECD8',
          200: '#FFD3A3',
          300: '#FFB76C',
          400: '#FF9B45',
          500: '#FF7F26',
          600: '#F06510',
          700: '#C64E0A',
        },
        // Ink (dark mode / text)
        ink: {
          400: '#6B6A5E',
          500: '#4C4C42',
          600: '#35362D',
          700: '#26271F',
          800: '#1A1B15',
          900: '#111209',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        sheet: '28px',
      },
      boxShadow: {
        // Soft shadows (light mode)
        soft: '0 2px 8px rgba(31, 34, 22, 0.06), 0 12px 28px -12px rgba(31, 34, 22, 0.16)',
        'soft-lg': '0 4px 14px rgba(31, 34, 22, 0.08), 0 24px 48px -20px rgba(31, 34, 22, 0.24)',
        // High-contrast shadows (dark mode)
        glow: '0 8px 24px -6px rgba(255, 127, 38, 0.55)',
        pin: '0 6px 14px rgba(24, 28, 16, 0.35)',
      },
      keyframes: {
        'pop-in': {
          '0%': { opacity: '0', transform: 'translateY(10px) scale(.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'pulse-ring': {
          '0%': { transform: 'scale(.6)', opacity: '.7' },
          '100%': { transform: 'scale(2.2)', opacity: '0' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(24px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pop-in': 'pop-in .32s cubic-bezier(.22,1,.36,1) both',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
        'slide-up': 'slide-up .38s cubic-bezier(.22,1,.36,1) both',
      },
    },
  },
  plugins: [],
};

export default config;
