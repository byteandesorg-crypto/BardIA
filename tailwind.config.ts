import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bardia: {
          blue: '#17324D',       // Azul Cordillera
          cyan: '#72B7C9',       // Celeste Glaciar
          green: '#3E6653',      // Verde Patagonia
          snow: '#F5F7F6',       // Nieve
          rock: '#172127',       // Roca
          stone: '#D9E0DE',      // Piedra
          stoneLight: '#EBF0EE', // Piedra clara
          border: '#E2E8E6',     // Borde suave
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        'lg': '12px',
        'md': '10px',
        'sm': '8px',
      },
    },
  },
  plugins: [],
};

export default config;
