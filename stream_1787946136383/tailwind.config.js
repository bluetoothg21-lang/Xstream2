/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#0D0D0D',
        'void-2': '#111111',
        'void-3': '#161616',
        violet: {
          DEFAULT: '#7B2FFF',
          light: '#9B5FFF',
          dim: 'rgba(123,47,255,0.15)',
        },
        cyan: {
          DEFAULT: '#00E5FF',
          dim: 'rgba(0,229,255,0.15)',
        },
        glass: 'rgba(255,255,255,0.06)',
        'glass-border': 'rgba(255,255,255,0.10)',
        foreground: '#F0F0F0',
        muted: 'rgba(240,240,240,0.45)',
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'monospace'],
        sans: ['DM Sans', 'sans-serif'],
      },
      backgroundImage: {
        'gradient-violet-cyan': 'linear-gradient(135deg, #7B2FFF, #00E5FF)',
        'gradient-card': 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.9) 100%)',
      },
      animation: {
        'float': 'float-gentle 4s ease-in-out infinite',
        'pulse-dot': 'pulse-dot 2s ease-in-out infinite',
        'marquee': 'marquee 30s linear infinite',
        'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
        'blink': 'blink 1s step-end infinite',
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};