/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Pastel violet primary palette
        violet: {
          50: '#F9FAFB', // Light background
          100: '#F3F4F6', // Card backgrounds
          200: '#E5E7EB', // Borders
          300: '#D1D5DB', // Muted elements
          400: '#DCCEFF', // Violet border glow / active tab border
          500: '#BBA7F0', // Active tab text / primary violet
          600: '#9B7EDF', // Hover states
          700: '#7C65C6', // Pressed states
          800: '#5D4E75', // Dark violet
          900: '#3E3856', // Very dark
        },
        gray: {
          50: '#F9FAFB', // Light background (matches violet-50)
          100: '#F3F4F6', // Card background
          300: '#D1D5DB', // Borders
          400: '#9CA3AF', // Disabled text
          500: '#737373', // Muted text (inactive tabs)
          600: '#4B5563', // Secondary text
          700: '#374151', // Primary text
          800: '#1F2937', // Dark text
          900: '#111827', // Very dark text
        },
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'monospace'],
      },
      borderRadius: {
        lg: '8px',
      },
      boxShadow: {
        soft: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
        glow: '0 0 0 3px rgba(220, 206, 255, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
