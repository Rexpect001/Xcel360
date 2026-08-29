import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand blue - rebased on #006FEC: deeper, more professional, less glare
        brand: {
          50:  '#eef5ff',
          100: '#dceafe',
          200: '#b9d4fd',
          300: '#85b8fa',
          400: '#4b95f5',
          500: '#006fec',
          600: '#005fc9',
          700: '#004ca3',
          800: '#003a7d',
          900: '#002b5c',
          950: '#001d3f',
        },
        accent: {
          50:  '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        surface: {
          50:  '#f7f9fc',
          100: '#eef3f8',
          200: '#dbe5ef',
          300: '#b9c9da',
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
        sans: ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-sora)', 'Sora', 'Inter', 'system-ui', 'sans-serif'],
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
        'hero-gradient':   'linear-gradient(140deg, #001d3f 0%, #002b5c 18%, #004ca3 42%, #006fec 66%, #2f86f2 84%, #4b95f5 100%)',
        'card-shine':      'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)',
      },
      boxShadow: {
        'card-3d':  '0 20px 60px -10px rgba(0, 76, 163, 0.28)',
        'glow':     '0 0 40px rgba(0, 111, 236, 0.22)',
        'glow-sm':  '0 0 20px rgba(0, 111, 236, 0.15)',
        'premium':  '0 12px 32px -18px rgba(15, 23, 42, 0.26), 0 1px 4px rgba(15,23,42,0.06)',
        'accent':   '0 0 30px rgba(245, 158, 11, 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
