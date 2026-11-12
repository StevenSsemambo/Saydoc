/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        emerald: {
          50:  '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d2',
          300: '#86efad',
          400: '#4ade80',
          500: '#22c55e',
          600: '#00A86B',
          700: '#007A4D',
          800: '#005F3E',
          900: '#00512F',
          950: '#002d1a',
        },
        midnight: '#0D1F1A',
        charcoal: '#1C2B26',
        slate2:   '#3D5247',
        mist:     '#8BA99A',
        silver:   '#D4E3DC',
        cream:    '#F7FBF9',
        pale:     '#E8F8F1',
        gold:     '#C9A84C',
        danger:   '#C0392B',
        warning:  '#E67E22',
      },
      fontFamily: {
        sans:    ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card':      '0 2px 16px 0 rgba(0,168,107,0.08)',
        'card-hover':'0 8px 32px 0 rgba(0,168,107,0.18)',
        'btn':       '0 4px 14px 0 rgba(0,168,107,0.35)',
        'glow':      '0 0 20px rgba(0,168,107,0.3)',
      },
      animation: {
        'fade-in':  'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.35s ease-out',
        'bounce-dot':'bounceDot 1.2s infinite',
        'pulse-slow':'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        fadeIn:    { from:{opacity:0}, to:{opacity:1} },
        slideUp:   { from:{opacity:0,transform:'translateY(20px)'}, to:{opacity:1,transform:'translateY(0)'} },
        slideIn:   { from:{opacity:0,transform:'translateX(-16px)'}, to:{opacity:1,transform:'translateX(0)'} },
        bounceDot: { '0%,80%,100%':{transform:'scale(0)'}, '40%':{transform:'scale(1)'} },
      },
    },
  },
  plugins: [],
}
