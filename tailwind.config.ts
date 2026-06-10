import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Sidebar navy palette (matching design reference)
        sidebar: {
          bg: '#1a1f2e',
          hover: '#252c3d',
          active: '#2d3650',
          border: '#2a3148',
          text: '#a8b3cf',
          'text-active': '#ffffff',
          accent: '#4f6ef7',
        },
        // Editor canvas
        canvas: {
          bg: '#f8f7f4',
          'bg-dark': '#1e1e1e',
          paper: '#ffffff',
          'paper-dark': '#2a2a2a',
          border: '#e5e2dc',
        },
        // Typesetter panel
        panel: {
          bg: '#f0ede8',
          'bg-dark': '#252525',
          border: '#d9d4cc',
        },
        // AI chat
        ai: {
          bubble: '#4f6ef7',
          'bubble-text': '#ffffff',
          user: '#f0f4ff',
          'user-text': '#1a1f2e',
        },
        // Accent / brand
        brand: {
          DEFAULT: '#4f6ef7',
          light: '#7b95f9',
          dark: '#3451d1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        'editor-base': ['16px', { lineHeight: '1.8' }],
        'editor-sm': ['14px', { lineHeight: '1.7' }],
        'editor-lg': ['18px', { lineHeight: '1.85' }],
      },
      boxShadow: {
        'paper': '0 2px 16px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        'panel': '0 0 0 1px rgba(0,0,0,0.06), 0 4px 24px rgba(0,0,0,0.08)',
        'chat': '0 8px 32px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.12)',
        'book-card': '0 4px 16px rgba(0,0,0,0.14), 0 1px 4px rgba(0,0,0,0.08)',
        'book-hover': '0 8px 28px rgba(0,0,0,0.22), 0 2px 8px rgba(0,0,0,0.12)',
      },
      animation: {
        'slide-up': 'slideUp 0.2s ease-out',
        'fade-in': 'fadeIn 0.15s ease-out',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'typing': 'typing 0.8s steps(3, end) infinite',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0.8)', opacity: '0.5' },
          '40%': { transform: 'scale(1)', opacity: '1' },
        },
        typing: {
          '0%': { content: '.' },
          '33%': { content: '..' },
          '66%': { content: '...' },
        },
      },
    },
  },
  plugins: [],
}

export default config
