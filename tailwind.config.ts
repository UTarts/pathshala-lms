import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        "primary": "#22C55E", 
        "secondary": "#F97316",
        "accent-yellow": "#FACC15",
        "accent-purple": "#A855F7",
        "background-light": "#F0Fdfa",
        "background-dark": "#0F172A",
        "surface-light": "#ffffff",
        "surface-dark": "#1E293B",
      },
      fontFamily: {
        display: ["var(--font-plus-jakarta)", "sans-serif"]
      },
      borderRadius: {
        "DEFAULT": "0.5rem",
        "lg": "1rem",
        "xl": "1.5rem",
        "2xl": "2rem",
        "3xl": "2.5rem",
        "4xl": "3rem",
        "full": "9999px"
      },
      boxShadow: {
        "soft": "0 10px 40px -10px rgba(0,0,0,0.08)",
        "card": "0 8px 20px -4px rgba(0, 0, 0, 0.1), 0 4px 8px -2px rgba(0, 0, 0, 0.05)",
        "bubbly": "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1), inset 0 -4px 0 rgba(0,0,0,0.1)",
        "glow": "0 0 15px rgba(56, 189, 248, 0.5)",
      },
      keyframes: {
        wave: {
            '0%': { transform: 'translateX(0) translateZ(0) scaleY(1)' },
            '50%': { transform: 'translateX(-25%) translateZ(0) scaleY(0.8)' },
            '100%': { transform: 'translateX(-50%) translateZ(0) scaleY(1)' },
        },
        float: {
            '0%, 100%': { transform: 'translateY(0)' },
            '50%': { transform: 'translateY(-5px)' },
        },
        sparkle: {
            '0%, 100%': { opacity: '0.5', transform: 'scale(1)' },
            '50%': { opacity: '1', transform: 'scale(1.2)' },
        }
      },
      animation: {
        wave: 'wave 5s linear infinite',
        float: 'float 3s ease-in-out infinite',
        sparkle: 'sparkle 2s ease-in-out infinite',
      }
    },
  },
  plugins: [],
};

export default config;