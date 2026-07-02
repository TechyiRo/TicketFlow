/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        // Extend default screens
        'sm': '640px',
        'md': '768px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        '3xl': '1920px',
        // Custom media queries
        'tall': { 'raw': '(min-height: 800px)' },
        'short': { 'raw': '(max-height: 500px)' },
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      colors: {
        background: {
          primary: '#030712', /* Sleeker rich background */
          surface: 'rgba(15, 23, 42, 0.45)', /* Translucent surface */
          elevated: 'rgba(30, 41, 59, 0.55)', /* Translucent elevated */
        },
        accent: {
          primary: '#6366F1',
          glow: '#818CF8',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
          cyan: '#06B6D4',
          purple: '#D946EF',
        },
        text: {
          primary: '#F8FAFC',
          secondary: '#94A3B8',
        },
        borderColor: 'rgba(255, 255, 255, 0.08)',
      },
      boxShadow: {
        glow: '0 0 40px rgba(99, 102, 241, 0.15)',
        successGlow: '0 0 15px rgba(16, 185, 129, 0.2)',
        warningGlow: '0 0 15px rgba(245, 158, 11, 0.2)',
        dangerGlow: '0 0 15px rgba(239, 68, 68, 0.2)',
        primaryGlow: '0 0 15px rgba(99, 102, 241, 0.3)',
        neonCyan: '0 0 20px rgba(6, 182, 212, 0.3)',
        neonPurple: '0 0 20px rgba(217, 70, 239, 0.3)',
        neonIndigo: '0 0 20px rgba(99, 102, 241, 0.3)',
        glassShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}
