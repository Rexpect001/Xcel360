import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    // Display helpers (deadline tones, funding/category chips) live here
    './src/lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Xcel brand blue - #2266B1 (600) is the logo blue. White text on 600+ passes WCAG AA (5.8:1).
        brand: {
          50:  '#eef5fc',
          100: '#dbeaf8',
          200: '#b8d4f1',
          300: '#8ab7e6',
          400: '#5594d6',
          500: '#337cc6',
          600: '#2266b1',
          700: '#1d579a',
          800: '#1a4880',
          900: '#163b67',
          950: '#0e2643',
        },
        // Light "document" blue for highlights and soft fills (Word-style).
        // 200 is the highlight colour for text on brand-600 backgrounds (4.5:1).
        accent: {
          50:  '#f0f8fe',
          100: '#e3f1fd',
          200: '#cbe6fb',
          300: '#9fd0f6',
          400: '#41a5ee',
          500: '#2b8ddb',
          600: '#1f72b8',
          700: '#185a92',
        },
        // Ink - neutral text greys with a hint of blue. 400+ passes AA on white.
        ink: {
          50:  '#f6f8fb',
          100: '#edf1f6',
          200: '#d8e0ea',
          300: '#a3b1c4',
          400: '#5f6f86',
          500: '#4d5d75',
          600: '#3c4b62',
          700: '#2d3a4f',
          800: '#1f2a3c',
          900: '#131c2b',
          950: '#0b111c',
        },
        // Surfaces - very light blue page background and borders.
        surface: {
          50:  '#f5f8fc',
          100: '#ebf1f8',
          200: '#dbe4ef',
          300: '#c3d0e0',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },
        success: {
          50:  '#ecfdf5',
          100: '#d1fae5',
          600: '#059669',
          700: '#047857',
        },
        warning: {
          50:  '#fffbeb',
          100: '#fef3c7',
          600: '#d97706',
          700: '#b45309',
        },
        danger: {
          50:  '#fef2f2',
          100: '#fee2e2',
          600: '#dc2626',
          700: '#b91c1c',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Plus Jakarta Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      animation: {
        'float':       'float 6s ease-in-out infinite',
        'float-slow':  'float 8s ease-in-out infinite',
        'float-fast':  'float 4s ease-in-out infinite',
        'fade-up':     'fadeUp 0.6s ease-out forwards',
        'pulse-slow':  'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':     'shimmer 2s linear infinite',
        'scroll-up':   'scrollUp 20s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        scrollUp: {
          '0%':   { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(-50%)' },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-gradient':   'linear-gradient(180deg, #2266b1 0%, #1f5fa6 100%)',
        'card-shine':      'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
      },
      boxShadow: {
        'card-3d':  '0 20px 60px -10px rgba(0, 76, 163, 0.28)',
        'glow':     '0 0 40px rgba(0, 111, 236, 0.22)',
        'glow-sm':  '0 0 20px rgba(0, 111, 236, 0.15)',
        'premium':  '0 12px 32px -18px rgba(15, 23, 42, 0.26), 0 1px 4px rgba(15,23,42,0.06)',
        'accent':   '0 8px 24px -10px rgba(34, 102, 177, 0.45)',
        'soft':     '0 1px 2px rgba(19,28,43,0.04), 0 4px 16px -8px rgba(19,28,43,0.10)',
      },
    },
  },
  plugins: [],
}

export default config
