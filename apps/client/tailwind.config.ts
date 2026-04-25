import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Classic Callbreak palette
        'cb-red': '#8B1A1A',
        'cb-red-dark': '#6B1212',
        'cb-red-light': '#A52020',
        'cb-green': '#2D6A4F',
        'cb-green-dark': '#1B4332',
        'cb-gold': '#F5C518',
        'cb-gold-dark': '#D4A017',
        'cb-orange': '#FF8C00',
        'cb-orange-dark': '#E07B00',
        'cb-cream': '#FFF8E7',
      },
      fontFamily: {
        display: ['"Fredoka One"', 'cursive'],
        body: ['"Nunito"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'diamond-pattern': `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Cpolygon points='20,4 36,20 20,36 4,20' fill='none' stroke='%23A52020' stroke-width='1.5'/%3E%3C/svg%3E")`,
      },
      animation: {
        'pulse-glow': 'pulseGlow 1.4s ease-in-out infinite',
        'float-in': 'floatIn 0.6s ease-out',
        'card-deal': 'cardDeal 0.4s ease-out',
        'score-pop': 'scorePop 0.3s ease-out',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(45, 106, 79, 0.7)' },
          '50%': { boxShadow: '0 0 0 8px rgba(45, 106, 79, 0)' },
        },
        floatIn: {
          from: { transform: 'translateY(30px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        cardDeal: {
          from: { transform: 'scale(0.5) rotate(-10deg)', opacity: '0' },
          to: { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        scorePop: {
          '0%': { transform: 'scale(0.5)' },
          '70%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
