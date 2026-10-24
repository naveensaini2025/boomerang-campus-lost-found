/** Tailwind theme — all Boomerang colours live here. */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: '#1B2A6B',
        purple: '#4B2FA0',
        maroon: '#6B2226',
        lost: '#E5572C',
        found: '#0F9D74',
        ai: '#5B3FD0',
        amber: '#F2B01E',
        page: '#F4F6FB',
        ink: '#16204A',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    boxShadow: {
      card: '0 1px 3px rgba(16, 24, 40, 0.02), 0 1px 2px rgba(16, 24, 40, 0.04)',
      cardHover: '0 12px 40px -12px rgba(27, 42, 107, 0.25)',
      phone: '0 40px 90px -20px rgba(27, 42, 107, 0.45)',
      float: '0 20px 60px -20px rgba(27, 42, 107, 0.35)',
      glow: '0 0 0 1px rgba(242, 176, 30, 0.4), 0 10px 40px -10px rgba(242, 176, 30, 0.4)',
    },
    keyframes: {
      fadeUp: {
        from: { opacity: '0', transform: 'translateY(8px)' },
        to: { opacity: '1', transform: 'translateY(0)' },
      },
      scaleIn: {
        from: { opacity: '0', transform: 'scale(0.98)' },
        to: { opacity: '1', transform: 'scale(1)' },
      },
      shimmer: {
        '0%': { backgroundPosition: '-200% 0' },
        '100%': { backgroundPosition: '200% 0' },
      },
    },
    animation: {
      fadeUp: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) both',
      scaleIn: 'scaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) both',
      shimmer: 'shimmer 3s linear infinite',
    },
    },
  },
  plugins: [],
}
