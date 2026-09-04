/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        void: {
          '000': '#050506', // true black — page ground
          '100': '#0C0C0F', // panel
          '200': '#141419', // raised panel
          '300': '#1E1E25', // hairline / border
          '400': '#2A2A33',
        },
        silver: {
          hi: '#F4F6F8', // specular highlight
          DEFAULT: '#BCC3CB', // body silver
          mid: '#8A929C',
          lo: '#5A616B', // muted / captions
        },
        flare: {
          DEFAULT: '#FF5A00', // primary orange
          hot: '#FF8A3D', // highlight
          deep: '#B32E00', // shadow
          ember: '#FFB27A',
        },
      },
      fontFamily: {
        display: ['Anton', 'Impact', 'Haettenschweiler', 'sans-serif'],
        sans: ['"Space Grotesk"', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      letterSpacing: {
        tightest: '-0.055em',
        widest2: '0.32em',
      },
      screens: {
        xs: '420px',
      },
      animation: {
        'marquee-l': 'marquee-l 34s linear infinite',
        'marquee-r': 'marquee-r 34s linear infinite',
        'ember-drift': 'ember-drift 9s ease-in-out infinite',
        'door-pulse': 'door-pulse 3.4s ease-in-out infinite',
        'scan': 'scan 7s linear infinite',
        'blink': 'blink 1.6s steps(2, start) infinite',
        'beam-a': 'beam 17s ease-in-out infinite',
        'beam-b': 'beam 23s ease-in-out infinite',
      },
      keyframes: {
        'marquee-l': {
          '0%': { transform: 'translate3d(0,0,0)' },
          '100%': { transform: 'translate3d(-50%,0,0)' },
        },
        'marquee-r': {
          '0%': { transform: 'translate3d(-50%,0,0)' },
          '100%': { transform: 'translate3d(0,0,0)' },
        },
        'ember-drift': {
          '0%,100%': { transform: 'translate3d(0,0,0) scale(1)', opacity: '0.55' },
          '50%': { transform: 'translate3d(0,-18px,0) scale(1.08)', opacity: '0.85' },
        },
        'door-pulse': {
          '0%,100%': { opacity: '0.35' },
          '50%': { opacity: '0.9' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
        blink: {
          '0%,100%': { opacity: '1' },
          '50%': { opacity: '0.15' },
        },
        beam: {
          '0%': { transform: 'translateX(-25vw) rotate(16deg)', opacity: '0' },
          '12%': { opacity: '1' },
          '88%': { opacity: '1' },
          '100%': { transform: 'translateX(115vw) rotate(16deg)', opacity: '0' },
        },
      },
    },
  },
  plugins: [],
}
