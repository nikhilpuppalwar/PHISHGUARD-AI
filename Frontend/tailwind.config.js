/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060B13',
          900: '#0B1220',
          850: '#0F1A2E',
          800: '#14233D',
          700: '#1E3256',
          card: '#131E32',
          border: '#1E2C44'
        },
        brand: {
          blue: '#2563EB',
          hover: '#1d4ed8',
          cyan: '#06B6D4',
          purple: '#8B5CF6'
        },
        risk: {
          low: '#10B981',
          medium: '#F59E0B',
          high: '#EF4444',
          critical: '#B91C1C'
        },
        agent: {
          text: '#3B82F6',
          url: '#06B6D4',
          sender: '#6366F1',
          rag: '#8B5CF6'
        },
        page: {
          bg: '#F8FAFC'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace']
      },
      boxShadow: {
        'glow-cyan': '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.25)',
        'glow-red': '0 0 25px -5px rgba(239, 68, 68, 0.25)',
        'subtle': '0 1px 8px rgba(0,0,0,0.04)'
      }
    },
  },
  plugins: [],
}
