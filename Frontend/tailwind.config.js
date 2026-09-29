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
          card: '#111B2E',
          border: '#1E2C44'
        },
        brand: {
          blue: '#2563EB',
          hover: '#1D4ED8',
          active: '#1E40AF',
          light: '#EFF6FF'
        },
        risk: {
          low: '#059669',
          medium: '#D97706',
          high: '#DC2626',
          critical: '#991B1B'
        },
        agent: {
          text: '#2563EB',
          url: '#0284C7',
          sender: '#4F46E5',
          rag: '#7C3AED'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace']
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 2px 6px -1px rgba(0, 0, 0, 0.03)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08)'
      }
    },
  },
  plugins: [],
}
