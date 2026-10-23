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
        card: '0 6px 20px rgba(27, 42, 107, 0.07)',
        phone: '0 40px 90px -20px rgba(27, 42, 107, 0.45)',
        float: '0 10px 24px rgba(27, 42, 107, 0.18)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0) rotate(-6deg)' },
          '50%': { transform: 'translateY(-8px) rotate(-4deg)' },
        },
        floatAlt: {
          '0%, 100%': { transform: 'translateY(0) rotate(7deg)' },
          '50%': { transform: 'translateY(-10px) rotate(5deg)' },
        },
        pop: {
          '0%': { transform: 'scale(0.7) rotate(-8deg)', opacity: '0' },
          '60%': { transform: 'scale(1.06) rotate(-8deg)', opacity: '1' },
          '100%': { transform: 'scale(1) rotate(-8deg)', opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 4s ease-in-out infinite',
        floatAlt: 'floatAlt 5s ease-in-out infinite',
        pop: 'pop 0.45s cubic-bezier(.2,.9,.3,1.4) both',
        fadeUp: 'fadeUp 0.35s ease-out both',
      },
    },
  },
  plugins: [],
}
